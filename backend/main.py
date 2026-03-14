"""
BehaviorGuard — FastAPI Backend
All API routes: analyze, WebSocket streaming, simulate, sessions.
"""

import asyncio
import time
import uuid
from collections import deque
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from features import engineer_features
from model import get_model
from simulator import simulate_human_session, simulate_bot_session

# ---------------------------------------------------------------------------
# App initialization
# ---------------------------------------------------------------------------
app = FastAPI(title="BehaviorGuard API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store (last 50 sessions)
session_store: deque = deque(maxlen=50)

# Active WebSocket connections
active_ws_connections: List[WebSocket] = []

# Pre-load the model at startup
model = None


@app.on_event("startup")
async def startup_event():
    global model
    print("[BehaviorGuard] Starting up — loading model...")
    model = get_model()
    print("[BehaviorGuard] Ready.")


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class MouseEvent(BaseModel):
    x: float
    y: float
    t: float


class KeyEvent(BaseModel):
    key: str
    down: float
    up: float


class ScrollEvent(BaseModel):
    dy: float
    t: float


class Fingerprint(BaseModel):
    screen_width: Optional[float] = 1920
    screen_height: Optional[float] = 1080
    timezone_offset: Optional[float] = 0
    language: Optional[str] = "en"
    user_agent: Optional[str] = ""
    hardware_concurrency: Optional[float] = 4
    device_memory: Optional[float] = 4
    webdriver: Optional[bool] = False
    plugins_count: Optional[float] = 3
    canvas_fingerprint: Optional[bool] = True


class AnalyzeRequest(BaseModel):
    session_id: Optional[str] = None
    mouse_events: Optional[List[Dict]] = []
    key_events: Optional[List[Dict]] = []
    scroll_events: Optional[List[Dict]] = []
    fingerprint: Optional[Dict] = {}
    page_load_time: Optional[float] = 0
    submit_time: Optional[float] = 0


# ---------------------------------------------------------------------------
# Helper: process a raw payload through the full pipeline
# ---------------------------------------------------------------------------
def _process_payload(payload: Dict[str, Any]) -> Dict:
    t_start = time.time()

    features = engineer_features(payload)
    prediction = model.predict(features)
    shap_values = model.explain(features)

    processing_ms = round((time.time() - t_start) * 1000, 1)

    score = prediction["score"]
    verdict = prediction["verdict"]

    if score >= 0.70:
        recommendation = "grant_access"
    elif score >= 0.40:
        recommendation = "challenge"
    else:
        recommendation = "block_access"

    session = {
        "session_id": payload.get("session_id", str(uuid.uuid4())),
        "score": score,
        "verdict": verdict,
        "confidence_level": prediction["confidence_level"],
        "features": {k: round(v, 4) for k, v in features.items()},
        "shap_values": shap_values,
        "processing_time_ms": processing_ms,
        "recommendation": recommendation,
        "timestamp": time.time(),
    }
    return session


async def _broadcast(message: Dict):
    """Send a message to all connected WebSocket clients."""
    disconnected = []
    for ws in active_ws_connections:
        try:
            await ws.send_json(message)
        except Exception:
            disconnected.append(ws)
    for ws in disconnected:
        if ws in active_ws_connections:
            active_ws_connections.remove(ws)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/analyze")
async def analyze(request: AnalyzeRequest):
    """
    Receive raw behavioral signals from the login page.
    Returns classification result + SHAP explanation.
    """
    payload = request.dict()
    if not payload.get("session_id"):
        payload["session_id"] = str(uuid.uuid4())

    result = _process_payload(payload)
    session_store.appendleft(result)

    # Broadcast to dashboard via WebSocket
    await _broadcast({
        "type": "final_verdict",
        "session_id": result["session_id"],
        "score": result["score"],
        "verdict": result["verdict"],
        "confidence_level": result["confidence_level"],
        "features": result["features"],
        "shap_values": result["shap_values"],
        "processing_time_ms": result["processing_time_ms"],
        "recommendation": result["recommendation"],
        "timestamp": result["timestamp"],
    })

    return result


@app.post("/simulate/{session_type}")
async def simulate(session_type: str, sophistication: float = 0.0):
    """
    Fire a synthetic demo session through the pipeline.
    session_type: 'human' | 'bot' | 'sophisticated_bot'
    """
    if session_type == "human":
        payload = simulate_human_session()
    elif session_type == "bot":
        payload = simulate_bot_session(sophistication=0.0)
    elif session_type == "sophisticated_bot":
        payload = simulate_bot_session(sophistication=min(max(sophistication, 0.0), 1.0))
    else:
        raise HTTPException(status_code=400, detail=f"Unknown session type: {session_type}")

    result = _process_payload(payload)
    session_store.appendleft(result)

    await _broadcast({
        "type": "final_verdict",
        "session_id": result["session_id"],
        "score": result["score"],
        "verdict": result["verdict"],
        "confidence_level": result["confidence_level"],
        "features": result["features"],
        "shap_values": result["shap_values"],
        "processing_time_ms": result["processing_time_ms"],
        "recommendation": result["recommendation"],
        "timestamp": result["timestamp"],
    })

    return result


@app.get("/sessions")
async def get_sessions():
    """Return last 50 analyzed sessions."""
    return list(session_store)


@app.websocket("/ws/stream")
async def websocket_stream(websocket: WebSocket):
    """
    Real-time WebSocket endpoint for the dashboard.
    Pushes score updates and final verdicts as sessions are analyzed.
    """
    await websocket.accept()
    active_ws_connections.append(websocket)
    print(f"[WS] Client connected. Total: {len(active_ws_connections)}")

    await websocket.send_json({"type": "connected", "message": "BehaviorGuard stream ready"})

    try:
        while True:
            # Keep connection alive — wait for any message from client
            data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
            # Client can send "ping" to keep alive
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except (WebSocketDisconnect, asyncio.TimeoutError):
        pass
    except Exception as e:
        print(f"[WS] Error: {e}")
    finally:
        if websocket in active_ws_connections:
            active_ws_connections.remove(websocket)
        print(f"[WS] Client disconnected. Total: {len(active_ws_connections)}")
