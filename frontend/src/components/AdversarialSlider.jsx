// AdversarialSlider.jsx — Bot sophistication stress test control
import React, { useState } from 'react';

const API = 'https://behaviorguard-backend.onrender.com';

export default function AdversarialSlider({ onResult, loading, setLoading }) {
  const [sophistication, setSophistication] = useState(30);

  const getZone = (val) => {
    // Compute expected model confidence based on sophistication
    // At soph=0, model is ~97% confident bot. At soph=100, ~40-50%
    const estimatedBotScore = Math.max(0.03, 1 - (val / 100) * 0.60);
    const humanConfidence = Math.round((1 - estimatedBotScore) * 100);
    return { humanConfidence, botScore: estimatedBotScore };
  };

  const { humanConfidence } = getZone(sophistication);

  const getZoneLabel = () => {
    if (humanConfidence >= 70) return { cls: 'human-zone', text: `${humanConfidence}% — Model classifies as Human`, icon: '✓' };
    if (humanConfidence >= 40) return { cls: 'inconclusive', text: `${humanConfidence}% — Inconclusive — Fallback challenge would trigger`, icon: '⚠' };
    return { cls: 'bot-zone', text: `${humanConfidence}% — Bot detected — Access blocked`, icon: '✗' };
  };

  const zone = getZoneLabel();

  const runAdversarial = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const soph = sophistication / 100;
      const res = await fetch(`${API}/simulate/sophisticated_bot?sophistication=${soph}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (onResult) onResult(data);
    } catch (err) {
      console.error('Adversarial test failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Adversarial Stress Test</span>
        <button
          className="btn btn-secondary"
          onClick={runAdversarial}
          disabled={loading}
        >
          {loading ? <span className="spin">⟳</span> : '▶'} Run Adversarial Session
        </button>
      </div>
      <p className="adversarial-desc">
        Simulate a bot with varying levels of sophistication — from obvious scripted attacks (0%) to
        advanced human-mimicking bots (100%). Watch the model's confidence degrade as the bot
        becomes more sophisticated, and see when the fallback challenge would trigger.
      </p>
      <div className="slider-wrap">
        <div className="slider-labels">
          <span>🤖 Obvious Bot</span>
          <span style={{ color: 'var(--amber)' }}>Bot Sophistication: {sophistication}%</span>
          <span>🥷 Human-Mimicking</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={sophistication}
          onChange={e => setSophistication(Number(e.target.value))}
        />
        <div className={`adversarial-result ${zone.cls}`}>
          <span>{zone.icon}</span>
          <span>{zone.text}</span>
        </div>
      </div>
    </div>
  );
}
