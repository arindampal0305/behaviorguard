// MouseHeatmap.jsx — Mouse density heatmap on a login form outline
import React, { useRef, useEffect } from 'react';

const W = 520;
const H = 280;

// Login form zones (as fractions of canvas W×H) for the template outline
const FORM = {
  card:    { x: 0.12, y: 0.06, w: 0.76, h: 0.86 },
  input1:  { x: 0.20, y: 0.22, w: 0.60, h: 0.12 },
  input2:  { x: 0.20, y: 0.44, w: 0.60, h: 0.12 },
  button:  { x: 0.20, y: 0.66, w: 0.60, h: 0.13 },
};

// ── Gaussian splat helper ────────────────────────────────────────────────────
function addHeat(heatmap, px, py, radius, intensity) {
  const r2 = radius * radius;
  const xMin = Math.max(0, Math.floor(px - radius));
  const xMax = Math.min(W - 1, Math.ceil(px + radius));
  const yMin = Math.max(0, Math.floor(py - radius));
  const yMax = Math.min(H - 1, Math.ceil(py + radius));
  for (let y = yMin; y <= yMax; y++) {
    for (let x = xMin; x <= xMax; x++) {
      const dx = x - px, dy = y - py;
      const dist2 = dx * dx + dy * dy;
      if (dist2 <= r2) {
        const factor = (1 - dist2 / r2);
        heatmap[y * W + x] += intensity * factor * factor;
      }
    }
  }
}

// ── Synthetic human heatmap — clusters near input fields ────────────────────
function buildHumanHeatmap(count, jitter) {
  const heatmap = new Float32Array(W * H);
  if (count < 5) return heatmap;

  // Concentrate activity near the two input fields and the button
  const hotZones = [
    { cx: 0.50, cy: 0.28, spread: 0.18 + jitter / 200, weight: 0.40 },
    { cx: 0.50, cy: 0.50, spread: 0.15 + jitter / 200, weight: 0.35 },
    { cx: 0.50, cy: 0.725, spread: 0.10,                weight: 0.15 },
    { cx: 0.30, cy: 0.15,  spread: 0.08,                weight: 0.10 }, // drifted above form
  ];

  const n = Math.min(count, 400);
  for (let i = 0; i < n; i++) {
    const zone = hotZones[Math.floor(Math.random() * hotZones.length)];
    const rand = () => (Math.random() + Math.random() - 1);            // triangular
    const px = (zone.cx + rand() * zone.spread)     * W;
    const py = (zone.cy + rand() * zone.spread * 0.7) * H;
    const radius = 14 + jitter * 0.4;
    addHeat(heatmap, px, py, radius, zone.weight * 1.5);
  }
  return heatmap;
}

// ── Synthetic bot heatmap — either nothing or a single straight line ─────────
function buildBotHeatmap(count) {
  const heatmap = new Float32Array(W * H);
  if (count < 2) return heatmap;                                        // no mouse at all

  // Straight diagonal line from top-left to button center
  const steps = Math.min(count, 60);
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const px = (0.15 + t * 0.55) * W;
    const py = (0.10 + t * 0.62) * H;
    addHeat(heatmap, px, py, 8, 1.2);
  }
  return heatmap;
}

// ── Build heatmap from real mouse_events ────────────────────────────────────
function buildRealHeatmap(mouseEvents) {
  const heatmap = new Float32Array(W * H);
  if (!mouseEvents || mouseEvents.length < 2) return heatmap;

  // Normalize from screen coords to canvas coords
  const xs = mouseEvents.map(e => e.x);
  const ys = mouseEvents.map(e => e.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const pad = 0.10;
  for (const e of mouseEvents) {
    const px = (pad + ((e.x - minX) / rangeX) * (1 - pad * 2)) * W;
    const py = (pad + ((e.y - minY) / rangeY) * (1 - pad * 2)) * H;
    addHeat(heatmap, px, py, 16, 1.0);
  }
  return heatmap;
}

// ── Map heat value → RGBA colour ────────────────────────────────────────────
// Cool (dark blue) → warm (amber) → hot (red)
function heatColour(t) {
  // t in [0,1]
  if (t <= 0) return [0, 0, 0, 0];
  if (t < 0.25) {
    const s = t / 0.25;
    return [0, Math.round(s * 60), Math.round(80 + s * 120), Math.round(s * 180)];
  }
  if (t < 0.55) {
    const s = (t - 0.25) / 0.30;
    return [Math.round(s * 240), Math.round(60 + s * 100), Math.round(200 - s * 200), Math.round(180 + s * 50)];
  }
  if (t < 0.80) {
    const s = (t - 0.55) / 0.25;
    return [240, Math.round(160 - s * 60), 0, Math.round(230 + s * 25)];
  }
  const s = (t - 0.80) / 0.20;
  return [255, Math.round(100 - s * 100), 0, 255];
}

// ── Draw login form wireframe ────────────────────────────────────────────────
function drawFormOutline(ctx) {
  const boxColor  = 'rgba(255,255,255,0.07)';
  const lineColor = 'rgba(255,255,255,0.13)';
  const textColor = 'rgba(255,255,255,0.22)';

  // card
  const c = FORM.card;
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(c.x * W, c.y * H, c.w * W, c.h * H, 8);
  ctx.stroke();

  // input 1
  const i1 = FORM.input1;
  ctx.fillStyle = boxColor;
  ctx.beginPath();
  ctx.roundRect(i1.x * W, i1.y * H, i1.w * W, i1.h * H, 4);
  ctx.fill();
  ctx.strokeStyle = lineColor;
  ctx.stroke();

  // input 2
  const i2 = FORM.input2;
  ctx.beginPath();
  ctx.roundRect(i2.x * W, i2.y * H, i2.w * W, i2.h * H, 4);
  ctx.fill();
  ctx.stroke();

  // button
  const b = FORM.button;
  ctx.fillStyle = 'rgba(37,99,235,0.18)';
  ctx.beginPath();
  ctx.roundRect(b.x * W, b.y * H, b.w * W, b.h * H, 5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(59,130,246,0.3)';
  ctx.stroke();

  // labels
  ctx.fillStyle = textColor;
  ctx.font = '9px Inter, sans-serif';
  ctx.fillText('Email', i1.x * W + 6, (i1.y + i1.h / 2 + 0.01) * H);
  ctx.fillText('Password', i2.x * W + 6, (i2.y + i2.h / 2 + 0.01) * H);
  ctx.fillStyle = 'rgba(59,130,246,0.5)';
  ctx.textAlign = 'center';
  ctx.fillText('Sign In', (b.x + b.w / 2) * W, (b.y + b.h / 2 + 0.015) * H);
  ctx.textAlign = 'left';
}

// ── Component ────────────────────────────────────────────────────────────────
export default function MouseHeatmap({ mouseEvents, verdict, features }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#0d0f14';
    ctx.fillRect(0, 0, W, H);

    // Grid dots
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (let x = 20; x < W; x += 22)
      for (let y = 20; y < H; y += 22) {
        ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill();
      }

    const isHuman = verdict === 'human';
    const count   = features?.mouse_event_count ?? 0;
    const jitter  = features?.mouse_jitter_index ?? 0;
    const hasReal = Array.isArray(mouseEvents) && mouseEvents.length >= 2;

    // ── Build heatmap data ──
    let heatmap;
    if (hasReal) {
      heatmap = buildRealHeatmap(mouseEvents);
    } else if (count >= 5) {
      heatmap = isHuman ? buildHumanHeatmap(count, jitter) : buildBotHeatmap(count);
    } else {
      // No data at all — just show the form outline with no heat
      drawFormOutline(ctx);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Heatmap will appear after a session', W / 2, H - 16);
      ctx.textAlign = 'left';
      return;
    }

    // ── Normalize heat to [0,1] ──
    let maxVal = 0;
    for (let i = 0; i < heatmap.length; i++) if (heatmap[i] > maxVal) maxVal = heatmap[i];
    if (maxVal === 0) { drawFormOutline(ctx); return; }

    // ── Render heatmap via ImageData ──
    const imageData = ctx.createImageData(W, H);
    for (let i = 0; i < heatmap.length; i++) {
      const t = Math.min(heatmap[i] / maxVal, 1);
      const [r, g, b, a] = heatColour(t);
      imageData.data[i * 4]     = r;
      imageData.data[i * 4 + 1] = g;
      imageData.data[i * 4 + 2] = b;
      imageData.data[i * 4 + 3] = a;
    }
    ctx.putImageData(imageData, 0, 0);

    // ── Form wireframe overlay on top of heat ──
    drawFormOutline(ctx);

    // ── Legend ──
    const lgX = W - 68, lgY = H - 18;
    const grad = ctx.createLinearGradient(lgX, 0, lgX + 55, 0);
    grad.addColorStop(0,    'rgba(0,0,80,0.7)');
    grad.addColorStop(0.4,  'rgba(240,160,0,0.8)');
    grad.addColorStop(1,    'rgba(255,0,0,0.9)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(lgX, lgY, 55, 7, 3);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '8px Inter, sans-serif';
    ctx.fillText('low', lgX - 14, lgY + 7);
    ctx.fillText('high', lgX + 58, lgY + 7);

  }, [mouseEvents, verdict, features]);

  const hasReal = Array.isArray(mouseEvents) && mouseEvents.length >= 2;
  const count   = features?.mouse_event_count ?? 0;
  const isSynthetic = !hasReal && count >= 5;

  const badge = verdict === 'human' ? { label: 'Human density', color: '#4ade80' }
              : verdict === 'bot'   ? { label: 'Bot pattern',   color: '#f87171' }
              : null;

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <span className="card-title">Mouse Heatmap</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isSynthetic && (
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              (estimated)
            </span>
          )}
          {badge && (
            <span style={{
              fontSize: '0.68rem', fontWeight: 700,
              padding: '2px 8px', borderRadius: '999px',
              background: badge.color + '1a',
              color: badge.color,
              border: `1px solid ${badge.color}40`,
            }}>{badge.label}</span>
          )}
        </div>
      </div>
      <div style={{ padding: '0 0 0.5rem' }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{ width: '100%', height: `${H}px`, display: 'block', borderRadius: '0 0 10px 10px' }}
        />
      </div>
    </div>
  );
}
