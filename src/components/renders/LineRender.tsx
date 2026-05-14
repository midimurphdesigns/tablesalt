'use client';

import type { QueryResult } from '@/lib/types';
import { motion } from 'framer-motion';

export function LineRender({ result }: { result: QueryResult }) {
  const [labelCol, valueCol] = result.columns;
  const rows = result.rows.slice(0, 200);
  const values = rows.map((r) => Number(r[valueCol] ?? 0));
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const width = 600;
  const height = 200;
  const padding = 24;

  if (rows.length === 0) {
    return <p className="type-mono text-[color:var(--color-ink-muted)]">No data to plot.</p>;
  }

  const points = rows
    .map((_, i) => {
      const x = padding + (i / Math.max(rows.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - ((values[i] - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ maxHeight: 280 }}
      >
        <motion.polyline
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
          fill="none"
          stroke="rgba(77,255,255,0.8)"
          strokeWidth="1.5"
          points={points}
          style={{ filter: 'drop-shadow(0 0 6px rgba(77,255,255,0.3))' }}
        />
      </svg>
      <p className="mt-3 type-mono-tiny text-[color:var(--color-ink-faint)]">
        {rows.length} points · {labelCol} → {valueCol}
      </p>
    </div>
  );
}
