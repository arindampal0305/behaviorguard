// MousePathReplay.jsx — Canvas animation of recorded mouse trajectory
import React, { useRef, useEffect } from 'react';

/**
 * Generate a plausible synthetic mouse path from feature hints.
 * Used when raw mouse_events are unavailable in the session object.
 */
function generateSyntheticPath(features, isHuman) {
  const count = Math.min(Math.max(Math.round(features?.mouse_event_count ?? 0), 0), 400);
  const jitter = features?.mouse_jitter_index ?? 0;
  const curvature = features?.mouse_path_curvature ?? 1;

  if (count < 5) return [];

  const events = [];
  // Start near top-left quadrant, head toward a form field area
  let x = 180 + Math.random() * 200;
  let y = 80 + Math.random() * 100;

  // Two waypoints to simulate real form interaction
  const targets = [
    { x: 200 + Math.random() * 300, y: 120 + Math.random() * 60 },
    { x: 150 + Math.random() * 350, y: 200 + Math.random() * 80 },
  ];
  let targetIdx = 0;

  for (let i = 0; i < count; i++) {
    const tgt = targets[targetIdx] ?? targets[targets.length - 1];
    const progress = i / count;

    if (isHuman) {
      // Organic: gaussian noise + jitter proportional to feature
      const noise = Math.min(jitter / 5, 6);
      const dx = (tgt.x - x) * 0.04 + (Math.random() - 0.5) * noise;
      const dy = (tgt.y - y) * 0.04 + (Math.random() - 0.5) * noise;
      x += dx;
      y += dy;
      // Occasional micro-pause (direction reversal)
      if (curvature < 0.7 && Math.random() < 0.03) {
        x -= dx * 0.3;
        y -= dy * 0.3;
      }
    } else {
      // Bot: very straight, nearly no deviation
      const dx = (tgt.x - x) * 0.08 + (Math.random() - 0.5) * 0.5;
      const dy = (tgt.y - y) * 0.08 + (Math.random() - 0.5) * 0.5;
      x += dx;
      y += dy;
    }

    x = Math.max(10, Math.min(1900, x));
    y = Math.max(10, Math.min(1060, y));
    events.push({ x, y, t: i * 16 });

    if (progress > 0.55 && targetIdx === 0) targetIdx = 1;
  }

  return events;
}

export default function MousePathReplay({ mouseEvents, verdict, features }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    // Cancel any running animation
    if (animRef.current) cancelAnimationFrame(animRef.current);
    ctx.clearRect(0, 0, W, H);

    // ── Determine which events to draw ──────────────────────────────
    const hasReal = Array.isArray(mouseEvents) && mouseEvents.length >= 2;
    const hasFeatures = features && (features.mouse_event_count ?? 0) >= 5;
    const isSynthetic = !hasReal && hasFeatures;
    const isHuman = verdict === 'human';

    let events = hasReal ? mouseEvents : (isSynthetic ? generateSyntheticPath(features, isHuman) : []);

    if (events.length < 2) {
      // Empty placeholder
      ctx.fillStyle = '#0d0f14';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      for (let x = 20; x < W; x += 25)
        for (let y = 20; y < H; y += 25) {
          ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill();
        }
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('Mouse path will appear here', W / 2, H / 2 - 8);
      ctx.fillText('after a session is analyzed', W / 2, H / 2 + 10);
      return;
    }

    // ── Normalize coordinates to canvas ─────────────────────────────
    const xs = events.map(e => e.x);
    const ys = events.map(e => e.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const pad = 20;
    const nx = x => pad + ((x - minX) / rangeX) * (W - pad * 2);
    const ny = y => pad + ((y - minY) / rangeY) * (H - pad * 2);

    // ── Background + grid ────────────────────────────────────────────
    ctx.fillStyle = '#0d0f14';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let x = 20; x < W; x += 25)
      for (let y = 20; y < H; y += 25) {
        ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill();
      }

    // ── Colours ──────────────────────────────────────────────────────
    const pathColor = isHuman ? '#4ade80' : '#f87171';
    const glowColor = isHuman ? 'rgba(74,222,128,0.4)' : 'rgba(248,113,113,0.4)';

    // ── Animated draw ────────────────────────────────────────────────
    const totalSteps = events.length;
    const stepsPerFrame = Math.max(1, Math.floor(totalSteps / 80));
    let step = 0;

    const drawFrame = () => {
      const limit = Math.min(step + stepsPerFrame, totalSteps - 1);
      const startIdx = step === 0 ? 0 : Math.max(0, step - stepsPerFrame);

      ctx.beginPath();
      ctx.strokeStyle = pathColor;
      ctx.lineWidth = 1.8;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(nx(events[startIdx].x), ny(events[startIdx].y));
      for (let i = startIdx + 1; i <= limit; i++) {
        ctx.lineTo(nx(events[i].x), ny(events[i].y));
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Moving cursor dot
      if (limit < totalSteps - 1) {
        const cx = nx(events[limit].x), cy = ny(events[limit].y);
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = pathColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      step = limit + stepsPerFrame;
      if (step < totalSteps) {
        animRef.current = requestAnimationFrame(drawFrame);
      } else {
        // Final dot
        const last = events[totalSteps - 1];
        ctx.beginPath();
        ctx.arc(nx(last.x), ny(last.y), 5, 0, Math.PI * 2);
        ctx.fillStyle = pathColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 16;
        ctx.fill();
      }
    };

    animRef.current = requestAnimationFrame(drawFrame);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [mouseEvents, verdict, features]);

  const label = verdict === 'human' ? '🟢 Organic human path'
              : verdict === 'bot'   ? '🔴 Scripted bot path'
              : '⬛ Awaiting session';

  const hasReal = Array.isArray(mouseEvents) && mouseEvents.length >= 2;
  const isSynthetic = !hasReal && features && (features.mouse_event_count ?? 0) >= 5;

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <span className="card-title">Mouse Path Replay</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isSynthetic && (
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              (estimated)
            </span>
          )}
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</span>
        </div>
      </div>
      <div className="mouse-canvas-wrap">
        <canvas ref={canvasRef} width={600} height={200} style={{ width: '100%', height: '200px' }} />
      </div>
    </div>
  );
}
