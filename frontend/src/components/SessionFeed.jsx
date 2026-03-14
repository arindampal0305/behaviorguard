// SessionFeed.jsx — Scrolling list of last 10 sessions
import React from 'react';

export default function SessionFeed({ sessions, onSelect, selectedId }) {
  const fmt = (ts) => {
    const d = new Date(ts * 1000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <span className="card-title">Live Session Feed</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{sessions.length} sessions</span>
      </div>
      {sessions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛡️</div>
          <div>Sessions will appear here in real time</div>
        </div>
      ) : (
        <div className="session-feed">
          {sessions.slice(0, 15).map((s) => (
            <div
              key={s.session_id}
              className={`session-item ${selectedId === s.session_id ? 'active' : ''}`}
              onClick={() => onSelect(s)}
            >
              <div className={`session-dot ${s.verdict}`} />
              <div className="session-info">
                <div className="session-id-short">
                  {s.session_id ? s.session_id.substring(0, 8) : '???'}…
                </div>
                <div className="session-time">{fmt(s.timestamp)}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                <span className={`session-score ${s.verdict}`}>
                  {Math.round(s.score * 100)}%
                </span>
                <span className={`verdict-badge ${s.verdict}`} style={{ fontSize: '0.62rem', padding: '1px 7px' }}>
                  {s.verdict === 'human' ? '✓ HUMAN' : '✗ BOT'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
