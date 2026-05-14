'use client';

import { motion } from 'framer-motion';
import type { DatasetProfile } from '@/lib/types';

type Props = {
  profile: DatasetProfile;
  onSuggested: (q: string) => void;
};

export function SchemaPanel({ profile, onSuggested }: Props) {
  return (
    <section className="surface p-6">
      <header className="flex items-baseline justify-between">
        <h2 className="type-h2">Your data, profiled.</h2>
        <p className="type-mono-tiny text-[color:var(--color-ink-faint)]">
          {profile.rowCount.toLocaleString()} rows · {profile.columns.length} cols
        </p>
      </header>

      <ul className="mt-6 grid gap-x-6 gap-y-3 md:grid-cols-2">
        {profile.columns.map((col, i) => (
          <motion.li
            key={col.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            className="flex items-baseline justify-between gap-3 border-b border-[color:var(--color-divider)] py-2"
          >
            <span className="truncate type-mono text-[color:var(--color-ink)]">{col.name}</span>
            <span className="shrink-0 type-mono-tiny text-[color:var(--color-ink-faint)]">
              {col.type} · {col.cardinality.toLocaleString()} distinct
            </span>
          </motion.li>
        ))}
      </ul>

      {profile.suggestedQuestions.length > 0 && (
        <div className="mt-8">
          <p className="eyebrow">try asking</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {profile.suggestedQuestions.map((q) => (
              <li key={q}>
                <button
                  type="button"
                  onClick={() => onSuggested(q)}
                  className="rounded-full border border-[color:var(--color-divider)] px-3 py-1.5 type-mono text-[color:var(--color-ink-muted)] transition-colors hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
                >
                  {q}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
