// ============================================================
// src/components/shared/Sparkline.tsx
// Pure native SVG sparkline renderer (Zero heavy chart libraries)
// Per EFFICIENCY.md §3 & ACCESSIBILITY.md §3
// ============================================================

import { memo } from 'react';

interface SparklineProps {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
  label?: string;
}

export const Sparkline = memo(function Sparkline({
  values,
  color = '#10b981',
  width = 160,
  height = 36,
  label = 'Trend sparkline',
}: SparklineProps) {
  if (!values || values.length === 0) {
    return <span className="text-xs text-slate-500">No telemetry data</span>;
  }

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step = width / Math.max(1, values.length - 1);

  const points = values.map((v, i) => ({
    x: i * step,
    y: height - ((v - min) / range) * (height - 6) - 3,
  }));

  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');

  return (
    <div className="relative inline-flex items-center">
      {/* Screen-reader only twin representation */}
      <span className="sr-only">
        {label}: values ranging from {min} to {max}, latest reading {values[values.length - 1]}
      </span>
      {/* Visual SVG marked aria-hidden */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
        role="presentation"
        className="overflow-visible"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === points.length - 1 ? 3 : 2}
            fill={color}
          />
        ))}
      </svg>
    </div>
  );
});
