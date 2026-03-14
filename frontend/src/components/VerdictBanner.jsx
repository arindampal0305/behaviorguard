// VerdictBanner.jsx — Full-width result banner at bottom of dashboard
import React from 'react';

export default function VerdictBanner({ verdict, score, recommendation, processingMs }) {
  if (!verdict) {
    return (
      <div className="verdict-banner idle">
        <span className="banner-icon">🛡️</span>
        <div className="banner-text">
          <div className="banner-headline">BehaviorGuard is monitoring</div>
          <div className="banner-detail">Waiting for session data — no CAPTCHA will be shown to humans</div>
        </div>
      </div>
    );
  }

  if (verdict === 'human') {
    return (
      <div className="verdict-banner human animate-in">
        <span className="banner-icon">✓</span>
        <div className="banner-text">
          <div className="banner-headline">Human Confirmed — Access Granted, No CAPTCHA Shown</div>
          <div className="banner-detail">
            Confidence: {Math.round(score * 100)}% · Recommendation: {recommendation?.replace(/_/g, ' ')} · Processed in {processingMs}ms
          </div>
        </div>
        <span className="banner-time">🔒 PASSTHROUGH</span>
      </div>
    );
  }

  if (verdict === 'bot') {
    const score_pct = Math.round(score * 100);
    const isMarginal = score_pct >= 40;
    return (
      <div className={`verdict-banner ${isMarginal ? 'pending' : 'bot'} animate-in`}>
        <span className="banner-icon">{isMarginal ? '⚠' : '✗'}</span>
        <div className="banner-text">
          <div className="banner-headline">
            {isMarginal
              ? `Inconclusive (${score_pct}%) — Fallback Challenge Triggered`
              : `Bot Detected — Access Blocked`
            }
          </div>
          <div className="banner-detail">
            Confidence: {score_pct}% · Recommendation: {recommendation?.replace(/_/g, ' ')} · Processed in {processingMs}ms
          </div>
        </div>
        <span className="banner-time">{isMarginal ? '🔐 CHALLENGE' : '🚫 BLOCKED'}</span>
      </div>
    );
  }

  return null;
}
