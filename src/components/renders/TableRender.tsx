'use client';

import type { QueryResult } from '@/lib/types';
import { motion } from 'framer-motion';

export function TableRender({ result }: { result: QueryResult }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[color:var(--color-divider)]">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-[color:var(--color-canvas)]">
            {result.columns.map((c) => (
              <th
                key={c}
                className="border-b border-[color:var(--color-divider)] px-4 py-3 type-mono-tiny text-[color:var(--color-ink-faint)]"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.slice(0, 50).map((row, i) => (
            <motion.tr
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.01, 0.5), duration: 0.2 }}
              className="border-b border-[color:var(--color-divider)] last:border-0 hover:bg-[color:var(--color-accent)]/[0.03]"
            >
              {result.columns.map((c) => (
                <td
                  key={c}
                  className="px-4 py-2.5 type-mono text-[color:var(--color-ink)]"
                >
                  {row[c] === null ? <span className="text-[color:var(--color-ink-faint)]">—</span> : String(row[c])}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
      {result.rows.length > 50 && (
        <p className="border-t border-[color:var(--color-divider)] px-4 py-2 type-mono-tiny text-[color:var(--color-ink-faint)]">
          showing first 50 of {result.rows.length.toLocaleString()} rows
        </p>
      )}
    </div>
  );
}
