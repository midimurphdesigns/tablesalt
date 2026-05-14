'use client';

import type { QueryResult } from '@/lib/types';
import { motion } from 'framer-motion';

export function StatRender({ result }: { result: QueryResult }) {
  const row = result.rows[0];
  if (!row) return <p className="type-mono text-[color:var(--color-ink-muted)]">No result.</p>;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {result.columns.map((col, i) => {
        const v = row[col];
        const display =
          typeof v === 'number'
            ? v.toLocaleString(undefined, { maximumFractionDigits: 2 })
            : String(v ?? '—');
        return (
          <motion.div
            key={col}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="rounded-lg border border-[color:var(--color-divider)] bg-[color:var(--color-canvas)] p-6"
          >
            <p className="eyebrow">{col}</p>
            <p
              className="mt-3 font-display italic"
              style={{ fontSize: 'clamp(40px,6vw,72px)', lineHeight: 1, color: 'var(--color-accent)' }}
            >
              {display}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
