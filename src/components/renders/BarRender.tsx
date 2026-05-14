'use client';

import type { QueryResult } from '@/lib/types';
import { motion } from 'framer-motion';

export function BarRender({ result }: { result: QueryResult }) {
  const [labelCol, valueCol] = result.columns;
  const rows = result.rows.slice(0, 20);
  const values = rows.map((r) => Number(r[valueCol] ?? 0));
  const max = Math.max(...values, 0);
  if (max === 0) return <p className="type-mono text-[color:var(--color-ink-muted)]">No data to chart.</p>;

  return (
    <div className="space-y-3">
      {rows.map((row, i) => {
        const value = Number(row[valueCol] ?? 0);
        const pct = (value / max) * 100;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            className="grid grid-cols-[minmax(120px,2fr)_5fr_minmax(60px,1fr)] items-center gap-4"
          >
            <span className="truncate type-mono text-[color:var(--color-ink)]">
              {String(row[labelCol] ?? '')}
            </span>
            <div className="h-6 overflow-hidden rounded bg-[color:var(--color-canvas)]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: i * 0.04 + 0.1, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
                className="h-full rounded bg-[color:var(--color-accent)]/30"
                style={{ boxShadow: '0 0 12px rgba(77,255,255,0.25)' }}
              />
            </div>
            <span className="text-right tabular-nums type-mono text-[color:var(--color-ink-muted)]">
              {value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
