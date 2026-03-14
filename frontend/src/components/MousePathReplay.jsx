// MousePathReplay.jsx — Canvas animation of recorded mouse trajectory
import React, { useRef, useEffect } from 'react';

export default function MousePathReplay({ mouseEvents, verdict }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    // Clear
    ctx.clearRect(0, 0, W, H);

    if (!mouseEvents || mouseEvents.length < 2) {
      // Draw placeholder
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('Mouse path will appear here', W / 2, H / 2 - 8);
      ctx.fillText('after a session is analyzed', W / 2, H / 2 + 10);
      return;
    }

    // Normalize coordinates to canvas size
    const xs = mouseEvents.map(e => e.x);
    const ys = mouseEvents.map(e => e.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const pad = 20;

    const nx = x => pad + ((x - minX) / rangeX) * (W - pad * 2);
    const ny = y => pad + ((y - minY) / rangeY) * (H - pad * 2);

    // Cancel any existing animation
    if (animRef.current) cancelAnimationFrame(animRef.current);

    // Draw background
    ctx.fillStyle = '#0d0f14';
    ctx.fillRect(0, 0, W, H);

    // Draw grid dots
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let x = 20; x < W; x += 25) {
      for (let y = 20; y < H; y += 25) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Animate path drawing
    const isHuman = verdict === 'human';
    const pathColor = isHuman ? '#4ade80' : '#f87171';
    const glowColor = isHuman ? 'rgba(74,222,128,0.4)' : 'rgba(248,113,113,0.4)';

    let step = 0;
    const totalSteps = mouseEvents.length;
    const stepsPerFrame = Math.max(1, Math.floor(totalSteps / 80)); // ~80 frames

    const drawFrame = () => {
      const limit = Math.min(step + stepsPerFrame, totalSteps - 1);

      // Draw path segment
      ctx.beginPath();
      ctx.strokeStyle = pathColor;
      ctx.lineWidth = 1.8;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const startIdx = step === 0 ? 0 : step - stepsPerFrame;
      ctx.moveTo(nx(mouseEvents[startIdx].x), ny(mouseEvents[startIdx].y));
      for (let i = startIdx + 1; i <= limit; i++) {
        ctx.lineTo(nx(mouseEvents[i].x), ny(mouseEvents[i].y));
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Cursor dot at current position
      if (limit < totalSteps - 1) {
        ctx.clearRect(W - 10, 0, 10, H); // clear cursor area hack
        const cx = nx(mouseEvents[limit].x);
        const cy = ny(mouseEvents[limit].y);
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
        // Draw final dot at end
        const last = mouseEvents[totalSteps - 1];
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
  }, [mouseEvents, verdict]);

  const label = verdict === 'human' ? '🟢 Organic human path' :
                verdict === 'bot'   ? '🔴 Scripted bot path' :
                '⬛ Awaiting session';

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <span className="card-title">Mouse Path Replay</span>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <div className="mouse-canvas-wrap">
        <canvas ref={canvasRef} width={600} height={200} style={{ width: '100%', height: '200px' }} />
      </div>
    </div>
  );
}
