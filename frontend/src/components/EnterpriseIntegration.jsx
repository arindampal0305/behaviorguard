// EnterpriseIntegration.jsx — SDK embed snippet card
import React, { useState } from 'react';

const SNIPPET = `<script src="https://behaviorguard.vercel.app/behaviorguard.js"></script>`;

const FEATURES = [
  { icon: '⚡', text: 'Zero configuration' },
  { icon: '🔌', text: 'Works with any login form' },
  { icon: '🔒', text: 'GDPR compliant by design' },
];

export default function EnterpriseIntegration() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SNIPPET).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="card" style={{ marginTop: '1rem' }}>
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{
            fontSize: '1rem',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>🧩</span>
          <span className="card-title">Enterprise Integration</span>
          <span style={{
            fontSize: '0.62rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '2px 7px',
            borderRadius: '999px',
            background: 'rgba(99,102,241,0.12)',
            color: '#818cf8',
            border: '1px solid rgba(99,102,241,0.25)',
          }}>One-line SDK</span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Drop into any web app — no backend changes needed
        </span>
      </div>

      {/* Code block row */}
      <div style={{ padding: '0 1rem 1rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: '#0d0f14',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '10px',
          padding: '0.75rem 1rem',
          fontFamily: "'Fira Code', 'Cascadia Code', 'Courier New', monospace",
          fontSize: '0.82rem',
          overflowX: 'auto',
          position: 'relative',
        }}>
          {/* Syntax-highlighted snippet */}
          <code style={{ flex: 1, whiteSpace: 'nowrap', lineHeight: 1.6 }}>
            <span style={{ color: '#f87171' }}>&lt;script</span>
            {' '}
            <span style={{ color: '#93c5fd' }}>src</span>
            <span style={{ color: '#d1d5db' }}>=</span>
            <span style={{ color: '#4ade80' }}>"https://behaviorguard.vercel.app/behaviorguard.js"</span>
            <span style={{ color: '#f87171' }}>&gt;&lt;/script&gt;</span>
          </code>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            style={{
              flexShrink: 0,
              padding: '5px 14px',
              borderRadius: '6px',
              border: copied ? '1px solid rgba(74,222,128,0.4)' : '1px solid rgba(255,255,255,0.12)',
              background: copied ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.06)',
              color: copied ? '#4ade80' : 'rgba(255,255,255,0.7)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              letterSpacing: '0.02em',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>

        {/* Bullet points */}
        <div style={{
          display: 'flex',
          gap: '2rem',
          marginTop: '1rem',
          flexWrap: 'wrap',
        }}>
          {FEATURES.map(f => (
            <div key={f.text} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
            }}>
              <span style={{ fontSize: '0.9rem' }}>{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
