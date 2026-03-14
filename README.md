# BehaviorGuard 🛡️
### ML-Based Passive Human Verification System
**Hack & Forge 2026 — Problem Statement 3**

> *Invisible protection. Zero friction. Human verified.*

---

## What Is This?

BehaviorGuard replaces CAPTCHA with an **intelligent passive ML system** that distinguishes humans from bots using behavioral signals — without ever interrupting the user.

### Three Components:
1. **Passive Signal Collector** (`behaviorguard.js`) — embeds into any login page, silently records mouse movement, typing rhythm, scroll patterns, and browser fingerprints
2. **ML Inference Backend** (`FastAPI + XGBoost`) — receives signals, runs 18-feature classification, returns a human/bot confidence score + SHAP explanation
3. **Live Threat Intelligence Dashboard** (`React`) — real-time session monitoring with mouse path replay, confidence timeline, SHAP explainability panel, and adversarial testing

---

## Quick Start

### 1. Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Train the ML Model (first run only — auto-trains if needed)
```bash
cd backend
python model.py
```

### 3. Start the Backend
```bash
cd backend
uvicorn main:app --reload --port 8000
```

### 4. Start the Frontend Dashboard
```bash
cd frontend
npm install     # first run only
npx vite        # or: set PATH to include nodejs, then npx vite
```

Or on Windows (if npx isn't in PATH):
```powershell
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
npm run dev
```

### 5. Access the Demo
| URL | Purpose |
|-----|---------|
| `http://localhost:5173` | **Dashboard** — threat intelligence view |
| `http://localhost:5173/login.html` | **Demo login page** — protected with BehaviorGuard |
| `http://localhost:8000/docs` | **API docs** — FastAPI interactive Swagger UI |

---

## Demo Flow (for judges)

1. Open **dashboard** in one window and **login page** in another
2. Type naturally in the login form → watch dashboard light up green
3. Click **"Simulate Bot"** → instant red verdict
4. Check the **SHAP Explainability** panel to see why
5. Move the **Adversarial Slider** to see confidence degrade with sophisticated bots

---

## ML Features (18 Engineered)

| Category | Features |
|---|---|
| Mouse | event count, avg speed, jitter index, path curvature, pause count |
| Keyboard | keystroke count, avg gap, rhythm entropy, backspace ratio, WPM |
| Scroll | event count, direction changes |
| Timing | time to first interaction, form fill duration |
| Fingerprint | timezone match, headless score, screen resolution, hardware concurrency |

**Algorithm:** XGBoost classifier  
**Training data:** 1,350 synthetic sessions (600 human + 600 bot + 150 sophisticated bot)  
**Explainability:** SHAP TreeExplainer — top 6 contributing features shown

---

## API Reference

```
POST  /analyze              → Analyze a raw signal payload
POST  /simulate/{type}      → Simulate: human | bot | sophisticated_bot
GET   /sessions             → Last 50 sessions
WS    /ws/stream            → Real-time WebSocket stream
GET   /health               → Health check
GET   /docs                 → Swagger UI
```

---

## Folder Structure

```
behaviorguard/
├── backend/
│   ├── main.py              ← FastAPI app, all routes
│   ├── model.py             ← XGBoost model (train/predict/explain)
│   ├── features.py          ← 18-feature engineering pipeline
│   ├── synthetic_data.py    ← Training data generator
│   ├── simulator.py         ← Demo session simulator
│   ├── requirements.txt
│   └── model_artifacts/
│       └── xgboost_model.pkl
└── frontend/
    ├── index.html           ← Dashboard entry point
    ├── login.html           ← Protected demo login page
    ├── vite.config.js
    └── src/
        ├── App.jsx          ← Root, WebSocket, state management
        ├── index.css        ← Design system (dark mode, tokens)
        ├── behaviorguard.js ← Passive signal collector
        └── components/
            ├── MetricCards.jsx
            ├── SignalBreakdown.jsx
            ├── MousePathReplay.jsx
            ├── ConfidenceTimeline.jsx
            ├── ExplainabilityPanel.jsx
            ├── SessionFeed.jsx
            ├── VerdictBanner.jsx
            ├── AdversarialSlider.jsx
            └── RawSignals.jsx
```

---

## Privacy Compliance

- ✅ **No PII collected** — behavioral patterns only, no names, emails, or passwords
- ✅ **No persistent storage** — all data processed in-session and stored only in memory (last 50 sessions)
- ✅ **GDPR-compatible by design** — no cross-session tracking, no cookies, no third-party calls
- ✅ **Transparent fallback** — when inconclusive, graceful challenge instead of blocking

---

*BehaviorGuard — Hack & Forge 2026*
