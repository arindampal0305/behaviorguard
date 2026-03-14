// MetricCards.jsx — 4 KPI stat cards at top of dashboard
import React from 'react';

export default function MetricCards({ score, verdict, signalCount, processingMs }) {
  // Determine color theme based on score
  const getScoreColor = () => {
    if (score === null) return 'blue';
    if (score >= 0.70) return 'green';
    if (score >= 0.40) return 'amber';
    return 'red';
  };

  const getVerdictColor = () => {
    if (!verdict || verdict === 'pending') return 'amber';
    return verdict === 'human' ? 'green' : 'red';
  };

  const scoreDisplay = score !== null ? `${Math.round(score * 100)}%` : '—';
  const verdictDisplay = verdict ? verdict.toUpperCase() : 'ANALYZING';
  const signalsDisplay = signalCount > 0 ? signalCount.toString() : '—';
  const timeDisplay = processingMs ? `${processingMs}ms` : '—';

  return (
    <div className="metric-row">
      {/* Confidence Score */}
      <div className={`metric-card ${getScoreColor()}`}>
        <div className="metric-label">Confidence Score</div>
        <div className="metric-value">{scoreDisplay}</div>
        <div className="metric-sub">
          {score === null ? 'Awaiting session data' :
           score >= 0.70 ? 'High confidence — human' :
           score >= 0.40 ? 'Inconclusive — challenge' :
           'Low confidence — bot'}
        </div>
      </div>

      {/* Verdict */}
      <div className={`metric-card ${getVerdictColor()}`}>
        <div className="metric-label">Verdict</div>
        <div className="metric-value" style={{ fontSize: '1.5rem', paddingTop: '0.3rem' }}>
          <span className={`verdict-badge ${verdict || 'pending'}`}>
            {verdict === 'human' ? '✓' : verdict === 'bot' ? '✗' : '◔'} {verdictDisplay}
          </span>
        </div>
        <div className="metric-sub" style={{ marginTop: '0.7rem' }}>
          {verdict === 'human' ? 'Access granted — no CAPTCHA' :
           verdict === 'bot' ? 'Access blocked — bot detected' :
           'Running behavioral analysis...'}
        </div>
      </div>

      {/* Signals Collected */}
      <div className="metric-card blue">
        <div className="metric-label">Signals Collected</div>
        <div className="metric-value">{signalsDisplay}</div>
        <div className="metric-sub">Behavioral data points</div>
      </div>

      {/* Processing Time */}
      <div className="metric-card blue">
        <div className="metric-label">Analysis Time</div>
        <div className="metric-value" style={{ fontSize: processingMs ? '1.8rem' : '2.2rem' }}>
          {timeDisplay}
        </div>
        <div className="metric-sub">End-to-end ML inference</div>
      </div>
    </div>
  );
}
