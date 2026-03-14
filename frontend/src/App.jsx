// App.jsx — BehaviorGuard Dashboard Root
// WebSocket state management + full dashboard layout
import React, { useState, useEffect, useRef, useCallback } from 'react';
import MetricCards from './components/MetricCards.jsx';
import SignalBreakdown from './components/SignalBreakdown.jsx';
import MousePathReplay from './components/MousePathReplay.jsx';
import ConfidenceTimeline from './components/ConfidenceTimeline.jsx';
import ExplainabilityPanel from './components/ExplainabilityPanel.jsx';
import SessionFeed from './components/SessionFeed.jsx';
import VerdictBanner from './components/VerdictBanner.jsx';
import AdversarialSlider from './components/AdversarialSlider.jsx';
import RawSignals from './components/RawSignals.jsx';

const API = 'https://behaviorguard-backend.onrender.com';
const WS_URL = 'wss://behaviorguard-backend.onrender.com/ws/stream';

export default function App() {
  // Current session state
  const [currentSession, setCurrentSession] = useState(null);
  // Session history for timeline + feed
  const [sessionHistory, setSessionHistory] = useState([]);
  // WebSocket connection status
  const [wsStatus, setWsStatus] = useState('disconnected');
  // Button loading states
  const [simLoading, setSimLoading] = useState(null); // 'human' | 'bot' | null
  const [advLoading, setAdvLoading] = useState(false);
  // Selected session in feed
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  // Mouse events for path replay
  const [mouseEvents, setMouseEvents] = useState(null);

  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);

  // ----------------------------------------------------------------
  // WebSocket setup with auto-reconnect
  // ----------------------------------------------------------------
  const connectWs = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus('connected');
      console.log('[BehaviorGuard] WebSocket connected');
      // Keepalive ping every 20s
      const ping = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('ping');
      }, 20000);
      ws._pingInterval = ping;
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'final_verdict') {
          handleIncomingVerdict(msg);
        }
      } catch (err) {
        console.warn('[WS] Parse error:', err);
      }
    };

    ws.onclose = () => {
      setWsStatus('disconnected');
      clearInterval(ws._pingInterval);
      console.log('[BehaviorGuard] WebSocket disconnected — reconnecting in 3s...');
      reconnectTimer.current = setTimeout(connectWs, 3000);
    };

    ws.onerror = (e) => {
      console.warn('[BehaviorGuard] WS error', e);
      ws.close();
    };
  }, []);

  useEffect(() => {
    connectWs();
    // Load existing sessions on mount
    fetch(`${API}/sessions`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setSessionHistory(data);
        }
      })
      .catch(() => { });
    return () => {
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connectWs]);

  // ----------------------------------------------------------------
  // Handle incoming verdict (from WS or direct API call)
  // ----------------------------------------------------------------
  const handleIncomingVerdict = useCallback((data) => {
    setCurrentSession(data);
    setSelectedSessionId(data.session_id);
    setSessionHistory(prev => {
      const filtered = prev.filter(s => s.session_id !== data.session_id);
      return [data, ...filtered].slice(0, 50);
    });
    // Always update mouse events — now guaranteed by the backend
    setMouseEvents(data.mouse_events ?? []);
  }, []);

  // ----------------------------------------------------------------
  // Simulate buttons
  // ----------------------------------------------------------------
  const simulate = async (type) => {
    setSimLoading(type);
    try {
      const res = await fetch(`${API}/simulate/${type}`, { method: 'POST' });
      const data = await res.json();
      // Enrich with mouse events for replay (pull from the simulate endpoint raw response)
      // The simulate endpoint also fires WS, but we can use local data faster
      handleIncomingVerdict(data);
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setSimLoading(null);
    }
  };

  const handleSessionSelect = (session) => {
    setCurrentSession(session);
    setSelectedSessionId(session.session_id);
  };

  // ----------------------------------------------------------------
  // Derived state
  // ----------------------------------------------------------------
  const score = currentSession ? currentSession.score : null;
  const verdict = currentSession ? currentSession.verdict : null;
  const features = currentSession ? currentSession.features : null;
  const shapValues = currentSession ? currentSession.shap_values : null;
  const processingMs = currentSession ? currentSession.processing_time_ms : null;
  const recommendation = currentSession ? currentSession.recommendation : null;

  // Signal count: sum of counts from features
  const signalCount = features
    ? Math.round(
      (features.mouse_event_count || 0) +
      (features.keystroke_count || 0) +
      (features.scroll_event_count || 0)
    )
    : 0;

  return (
    <div className="app-shell">
      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="navbar-logo">🛡️</div>
          <div>
            <div className="navbar-title">BehaviorGuard</div>
            <div className="navbar-subtitle">Invisible protection. Zero friction. Human verified.</div>
          </div>
        </div>
        <div className="navbar-actions">
          <div className="ws-indicator">
            <div className={`ws-dot ${wsStatus}`} />
            {wsStatus === 'connected' ? 'Live' : 'Reconnecting...'}
          </div>
          <button
            className="btn btn-human"
            onClick={() => simulate('human')}
            disabled={simLoading !== null}
          >
            {simLoading === 'human' ? <span className="spin">⟳</span> : '👤'}
            Simulate Human
          </button>
          <button
            className="btn btn-bot"
            onClick={() => simulate('bot')}
            disabled={simLoading !== null}
          >
            {simLoading === 'bot' ? <span className="spin">⟳</span> : '🤖'}
            Simulate Bot
          </button>
          <a
            href="/login.html"
            className="btn btn-secondary"
            target="_blank"
            rel="noreferrer"
          >
            🔐 Login Demo
          </a>
        </div>
      </nav>

      {/* ── Main Dashboard ── */}
      <main className="main-content">

        {/* Row 1: Metric Cards */}
        <MetricCards
          score={score}
          verdict={verdict}
          signalCount={signalCount}
          processingMs={processingMs}
        />

        {/* Row 2: Signal Breakdown + Raw Signals */}
        <div className="grid-2">
          <SignalBreakdown features={features} />
          <RawSignals features={features} />
        </div>

        {/* Row 3: Mouse Path + Confidence Timeline */}
        <div className="grid-2">
          <MousePathReplay mouseEvents={mouseEvents} verdict={verdict} features={features} />
          <ConfidenceTimeline history={sessionHistory} />
        </div>

        {/* Row 4: SHAP + Session Feed */}
        <div className="grid-2">
          <ExplainabilityPanel shapValues={shapValues} />
          <SessionFeed
            sessions={sessionHistory}
            onSelect={handleSessionSelect}
            selectedId={selectedSessionId}
          />
        </div>

        {/* Row 5: Adversarial Slider */}
        <AdversarialSlider
          onResult={(data) => handleIncomingVerdict(data)}
          loading={advLoading}
          setLoading={setAdvLoading}
        />

        {/* Row 6: Verdict Banner */}
        <VerdictBanner
          verdict={verdict}
          score={score}
          recommendation={recommendation}
          processingMs={processingMs}
        />

      </main>
    </div>
  );
}
