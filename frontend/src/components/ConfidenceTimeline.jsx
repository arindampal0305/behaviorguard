// ConfidenceTimeline.jsx — Real-time Chart.js line chart of score building over time
import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend);

export default function ConfidenceTimeline({ history }) {
  // history: array of { score, timestamp, verdict }
  const chartRef = useRef(null);

  const labels = history.map((_, i) => `S${i + 1}`);
  const scores = history.map(h => Math.round(h.score * 100));

  const getColor = (score) => {
    if (score >= 70) return '#4ade80';
    if (score >= 40) return '#fbbf24';
    return '#f87171';
  };

  const latestColor = scores.length > 0 ? getColor(scores[scores.length - 1]) : '#60a5fa';

  const data = {
    labels,
    datasets: [
      {
        label: 'Confidence Score (%)',
        data: scores,
        borderColor: latestColor,
        backgroundColor: `${latestColor}18`,
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: latestColor,
        pointBorderColor: '#0d0f14',
        pointBorderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 500, easing: 'easeOutCubic' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#181c25',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleColor: '#94a3b8',
        bodyColor: '#f1f5f9',
        titleFont: { family: 'Inter', size: 11 },
        bodyFont: { family: 'JetBrains Mono', size: 13 },
        callbacks: {
          label: ctx => ` ${ctx.parsed.y}% confidence`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#64748b', font: { size: 10, family: 'Inter' } },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          color: '#64748b',
          font: { size: 10, family: 'JetBrains Mono' },
          callback: v => `${v}%`,
        },
      },
    },
  };

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <span className="card-title">Confidence Timeline</span>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {history.length} session{history.length !== 1 ? 's' : ''}
        </span>
      </div>
      {history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📈</div>
          <div>Timeline will populate after first analysis</div>
        </div>
      ) : (
        <div style={{ height: '200px', position: 'relative' }}>
          <Line ref={chartRef} data={data} options={options} />
        </div>
      )}
    </div>
  );
}
