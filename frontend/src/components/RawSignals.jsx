// RawSignals.jsx — Table of exact feature values from the last session
import React from 'react';

const DISPLAY_FEATURES = [
  { key: 'mouse_event_count', label: 'Mouse Events', unit: '' },
  { key: 'mouse_avg_speed', label: 'Avg Mouse Speed', unit: ' px/ms' },
  { key: 'mouse_jitter_index', label: 'Mouse Jitter Index', unit: '°' },
  { key: 'mouse_path_curvature', label: 'Path Curvature', unit: '' },
  { key: 'avg_keystroke_gap_ms', label: 'Keystroke Gap', unit: ' ms' },
  { key: 'keystroke_rhythm_entropy', label: 'Rhythm Entropy', unit: '' },
  { key: 'backspace_ratio', label: 'Backspace Ratio', unit: '' },
  { key: 'typing_speed_wpm', label: 'Typing Speed', unit: ' wpm' },
  { key: 'scroll_event_count', label: 'Scroll Events', unit: '' },
  { key: 'time_to_first_interaction_ms', label: 'Time to First Action', unit: ' ms' },
  { key: 'headless_browser_score', label: 'Headless Score', unit: '' },
  { key: 'hardware_concurrency', label: 'CPU Cores', unit: '' },
];

export default function RawSignals({ features }) {
  if (!features) {
    return (
      <div className="card" style={{ height: '100%' }}>
        <div className="card-header"><span className="card-title">Raw Signal Values</span></div>
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <div>Feature values will appear after analysis</div>
        </div>
      </div>
    );
  }

  const fmt = (v) => {
    if (v === undefined || v === null) return '—';
    if (typeof v === 'number') return v >= 100 ? Math.round(v).toLocaleString() : v.toFixed(3);
    return String(v);
  };

  // Color code values (headless, jitter, etc.)
  const getValueColor = (key, val) => {
    if (key === 'headless_browser_score') return val > 0.5 ? 'var(--red)' : 'var(--green)';
    if (key === 'keystroke_rhythm_entropy') return val > 2.0 ? 'var(--green)' : val > 0.8 ? 'var(--amber)' : 'var(--red)';
    if (key === 'mouse_jitter_index') return val > 10 ? 'var(--green)' : val > 3 ? 'var(--amber)' : 'var(--red)';
    if (key === 'backspace_ratio') return val > 0.01 ? 'var(--green)' : 'var(--amber)';
    return 'var(--text-primary)';
  };

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <span className="card-title">Raw Signal Values</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{Object.keys(features).length} features</span>
      </div>
      <table className="raw-table">
        <thead>
          <tr>
            <th>Feature</th>
            <th style={{ textAlign: 'right' }}>Value</th>
          </tr>
        </thead>
        <tbody>
          {DISPLAY_FEATURES.map(f => (
            <tr key={f.key}>
              <td>{f.label}</td>
              <td style={{ color: getValueColor(f.key, features[f.key]) }}>
                {fmt(features[f.key])}{f.unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
