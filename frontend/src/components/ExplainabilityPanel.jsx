// ExplainabilityPanel.jsx — SHAP-style feature importance bar chart
import React from 'react';

export default function ExplainabilityPanel({ shapValues }) {
  if (!shapValues || shapValues.length === 0) {
    return (
      <div className="card" style={{ height: '100%' }}>
        <div className="card-header">
          <span className="card-title">SHAP Explainability</span>
        </div>
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div>Feature contributions will appear after analysis</div>
        </div>
      </div>
    );
  }

  // Take top 6 by absolute value
  const top6 = [...shapValues]
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 6);

  const maxAbs = Math.max(...top6.map(s => Math.abs(s.value)), 0.01);

  const formatFeatureName = (name) =>
    name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const formatValue = (v) => (v >= 0 ? `+${v.toFixed(3)}` : v.toFixed(3));

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <span className="card-title">SHAP Explainability</span>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Top 6 features</span>
      </div>
      <div className="shap-list">
        {top6.map((item) => {
          const pct = (Math.abs(item.value) / maxAbs) * 48; // max 48% each side
          const isPos = item.value >= 0;
          return (
            <div className="shap-item" key={item.feature}>
              <div className="shap-head">
                <span className="shap-feat">{formatFeatureName(item.feature)}</span>
                <span className={`shap-val ${isPos ? 'pos' : 'neg'}`}>
                  {formatValue(item.value)}
                </span>
              </div>
              <div className="shap-track">
                <div
                  className={`shap-fill ${isPos ? 'pos' : 'neg'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: '0.8rem', display: 'flex', gap: '1rem', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--green)', display: 'inline-block' }} />
          Pushes toward Human
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--red)', display: 'inline-block' }} />
          Pushes toward Bot
        </span>
      </div>
    </div>
  );
}
