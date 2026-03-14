// SignalBreakdown.jsx — Category-level signal bars
import React from 'react';

function getColor(pct) {
  if (pct >= 75) return 'green';
  if (pct >= 45) return 'amber';
  return 'red';
}

function getScoreColor(pct) {
  if (pct >= 75) return 'var(--green)';
  if (pct >= 45) return 'var(--amber)';
  return 'var(--red)';
}

export default function SignalBreakdown({ features }) {
  // Derive signal category scores from engineered features
  const computeSignals = () => {
    if (!features) return null;

    // Mouse naturalness: jitter (ideal ~25°), curvature (ideal < 0.9), event count, speed
    const jitterScore = Math.min((features.mouse_jitter_index || 0) / 50, 1);
    const curveScore = features.mouse_path_curvature < 0.99 ? 0.9 : 0.1;
    const mouseCount = features.mouse_event_count || 0;
    const mouseCountScore = mouseCount > 50 && mouseCount < 800 ? 0.9 : mouseCount > 10 ? 0.5 : 0.05;
    const mouseNaturalness = Math.round((jitterScore * 0.4 + curveScore * 0.35 + mouseCountScore * 0.25) * 100);

    // Typing rhythm: entropy, gap, backspace
    const entropyScore = Math.min((features.keystroke_rhythm_entropy || 0) / 4.5, 1);
    const gapScore = features.avg_keystroke_gap_ms > 80 && features.avg_keystroke_gap_ms < 500 ? 0.9 : features.avg_keystroke_gap_ms > 20 ? 0.4 : 0.05;
    const backspaceScore = (features.backspace_ratio || 0) > 0.01 ? 0.9 : 0.1;
    const typingRhythm = Math.round((entropyScore * 0.5 + gapScore * 0.3 + backspaceScore * 0.2) * 100);

    // Browser entropy: headless, fingerprint signals
    const headlessInverse = 1 - Math.min((features.headless_browser_score || 0), 1);
    const resolutionScore = features.screen_resolution_common || 0;
    const hwScore = Math.min((features.hardware_concurrency || 1) / 8, 1);
    const tzMatch = features.timezone_language_match || 0;
    const browserEntropy = Math.round((headlessInverse * 0.45 + resolutionScore * 0.2 + hwScore * 0.2 + tzMatch * 0.15) * 100);

    // Scroll behavior
    const scrollCount = features.scroll_event_count || 0;
    const scrollScore = scrollCount > 1 ? Math.min(scrollCount / 15, 1) * 0.8 + 0.2 : 0.05;
    const dirScore = (features.scroll_direction_changes || 0) > 0 ? 0.9 : 0.3;
    const scrollBehavior = Math.round((scrollScore * 0.6 + dirScore * 0.4) * 100);

    return [
      { name: 'Mouse Naturalness', pct: Math.min(mouseNaturalness, 100) },
      { name: 'Typing Rhythm', pct: Math.min(typingRhythm, 100) },
      { name: 'Browser Entropy', pct: Math.min(browserEntropy, 100) },
      { name: 'Scroll Behavior', pct: Math.min(scrollBehavior, 100) },
    ];
  };

  const signals = computeSignals();

  if (!signals) {
    return (
      <div className="card" style={{ height: '100%' }}>
        <div className="card-header"><span className="card-title">Signal Breakdown</span></div>
        <div className="empty-state">
          <div className="empty-icon">📡</div>
          <div>Awaiting session data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <span className="card-title">Signal Breakdown</span>
        <span className="tag live">LIVE</span>
      </div>
      <div className="signal-list">
        {signals.map(sig => {
          const col = getColor(sig.pct);
          return (
            <div className="signal-item" key={sig.name}>
              <div className="signal-header">
                <span className="signal-name">{sig.name}</span>
                <span className="signal-pct" style={{ color: getScoreColor(sig.pct) }}>
                  {sig.pct}%
                </span>
              </div>
              <div className="signal-bar-track">
                <div
                  className={`signal-bar-fill ${col}`}
                  style={{ width: `${sig.pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
