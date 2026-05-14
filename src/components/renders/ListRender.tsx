'use client';

import type { QueryResult } from '@/lib/types';
import { motion } from 'framer-motion';

export function ListRender({ result }: { result: QueryResult }) {
  return (
    <ul className="space-y-2">
      {result.rows.slice(0, 20).map((row, i) => (
        <motion.li
          key={i}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04, duration: 0.25 }}
          className="border-b border-[color:var(--color-divider)] py-2 last:border-0"
        >
          {result.columns.map((c) => (
            <span key={c} className="mr-4 type-mono text-[color:var(--color-ink)]">
              {String(row[c] ?? '')}
            </span>
          ))}
        </motion.li>
      ))}
    </ul>
  );
}
