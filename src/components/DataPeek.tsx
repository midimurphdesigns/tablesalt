'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { runQuery } from '@/lib/duckdb';
import type { ColumnProfile, DatasetProfile, QueryResult } from '@/lib/types';

type Props = {
  profile: DatasetProfile;
  onSuggested: (q: string) => void;
};

export function DataPeek({ profile, onSuggested }: Props) {
  const [preview, setPreview] = useState<QueryResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    runQuery('SELECT * FROM data LIMIT 8')
      .then((r) => {
        if (!cancelled) setPreview(r);
      })
      .catch(() => {
        if (!cancelled) setPreview({ columns: [], rows: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  return (
    <section className="surface relative overflow-hidden">
      {/* Section header */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 p-6 pb-4 md:p-8 md:pb-5">
        <h2 className="type-h2">Your data.</h2>
        <p className="type-mono-tiny text-[color:var(--color-ink-faint)]">
          {profile.rowCount.toLocaleString()} rows · {profile.columns.length} cols
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        {/* Left — column profile */}
        <div className="border-b border-[color:var(--color-divider)] md:border-b-0 md:border-r">
          <p className="px-6 pb-3 type-mono-tiny text-[color:var(--color-ink-faint)] md:px-8">
            columns
          </p>
          <ul className="divide-y divide-[color:var(--color-divider)] border-t border-[color:var(--color-divider)]">
            {profile.columns.map((col, i) => (
              <ProfileRow key={col.name} col={col} index={i} rowCount={profile.rowCount} />
            ))}
          </ul>
        </div>

        {/* Right — spreadsheet preview */}
        <div className="overflow-hidden">
          <p className="px-6 pb-3 pt-6 type-mono-tiny text-[color:var(--color-ink-faint)] md:px-8 md:pt-0">
            first 8 rows
          </p>
          {preview && preview.columns.length > 0 ? (
            <div className="overflow-x-auto border-t border-[color:var(--color-divider)]">
              <table className="w-full border-collapse">
                <thead className="bg-[color:var(--color-canvas)]">
                  <tr>
                    {preview.columns.map((c) => (
                      <th
                        key={c}
                        className="border-b border-[color:var(--color-divider)] px-3 py-2 text-left type-mono-tiny text-[color:var(--color-ink-faint)]"
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, y: 2 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 + profile.columns.length * 0.03, duration: 0.2 }}
                      className="border-b border-[color:var(--color-divider)] transition-colors last:border-0 hover:bg-[color:var(--color-accent)]/[0.04]"
                    >
                      {preview.columns.map((c) => {
                        const v = row[c];
                        const isNumeric = typeof v === 'number';
                        return (
                          <td
                            key={c}
                            className={`px-3 py-2 type-mono text-[12px] text-[color:var(--color-ink)] ${isNumeric ? 'text-right tabular-nums' : ''}`}
                          >
                            {v === null ? (
                              <span className="text-[color:var(--color-ink-faint)]">—</span>
                            ) : isNumeric ? (
                              v.toLocaleString(undefined, { maximumFractionDigits: 3 })
                            ) : (
                              String(v)
                            )}
                          </td>
                        );
                      })}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border-t border-[color:var(--color-divider)] px-6 py-8 type-mono text-[color:var(--color-ink-faint)] md:px-8">
              loading preview…
            </div>
          )}
        </div>
      </div>

      {/* Suggested questions footer */}
      {profile.suggestedQuestions.length > 0 && (
        <div className="border-t border-[color:var(--color-divider)] p-6 md:p-8">
          <p className="eyebrow mb-3">try asking</p>
          <ul className="flex flex-wrap gap-2">
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

function ProfileRow({
  col,
  index,
  rowCount,
}: {
  col: ColumnProfile;
  index: number;
  rowCount: number;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      className="grid grid-cols-[1fr_auto] items-baseline gap-3 px-6 py-3 md:px-8"
    >
      <div className="min-w-0">
        <p className="truncate type-mono text-[color:var(--color-ink)]">{col.name}</p>
        <ProfileChart col={col} rowCount={rowCount} />
      </div>
      <p className="shrink-0 type-mono-tiny text-[color:var(--color-ink-faint)]">
        {col.type} · {col.cardinality.toLocaleString()}
      </p>
    </motion.li>
  );
}

function ProfileChart({ col, rowCount }: { col: ColumnProfile; rowCount: number }) {
  // Type-aware micro-charts. Drawn as horizontal bars / wedges in pure
  // CSS — no external charting lib needed for a ~60px wide visual.
  if (col.type === 'number' || col.type === 'date') {
    return (
      <p className="mt-1.5 truncate type-mono-tiny text-[color:var(--color-ink-faint)]">
        {col.min !== undefined && col.max !== undefined
          ? `${formatBound(col.min)} → ${formatBound(col.max)}`
          : col.sample.slice(0, 3).join(' · ')}
      </p>
    );
  }

  if (col.type === 'boolean') {
    return (
      <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-[color:var(--color-canvas)]">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.2, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ width: '60%', transformOrigin: 'left' }}
          className="bg-[color:var(--color-accent)]/40"
        />
      </div>
    );
  }

  // string / categorical — stacked top-values bar
  const totalSamples = Math.max(col.cardinality, 1);
  const slots = Math.min(col.sample.length, 3);
  const sharePerSlot = slots > 0 ? (1 / Math.max(slots, 1)) * Math.min(slots / totalSamples + 0.4, 0.95) : 0;
  const remaining = Math.max(0, 1 - sharePerSlot * slots);

  return (
    <div className="mt-1.5 flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-[color:var(--color-canvas)]">
      {Array.from({ length: slots }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.2 + i * 0.04, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          style={{
            width: `${sharePerSlot * 100}%`,
            transformOrigin: 'left',
            opacity: 1 - i * 0.25,
          }}
          className="bg-[color:var(--color-accent)]/60"
        />
      ))}
      {remaining > 0 && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.2 + slots * 0.04, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ width: `${remaining * 100}%`, transformOrigin: 'left' }}
          className="bg-[color:var(--color-ink-faint)]/30"
        />
      )}
    </div>
  );
}

function formatBound(v: number | string): string {
  if (typeof v === 'number') {
    return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  return String(v);
}
