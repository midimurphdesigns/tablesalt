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
              <ProfileRow key={col.name} col={col} index={i} />
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

function ProfileRow({ col, index }: { col: ColumnProfile; index: number }) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      className="grid grid-cols-1 gap-2 px-6 py-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)_auto] md:items-center md:gap-4 md:px-8"
    >
      <div className="min-w-0">
        <p className="truncate type-mono text-[color:var(--color-ink)]">{col.name}</p>
        <p className="mt-0.5 type-mono-tiny text-[color:var(--color-ink-faint)]">
          {col.type} · {col.cardinality.toLocaleString()} distinct
        </p>
      </div>
      <div className="min-w-0">
        <ProfileChart col={col} />
      </div>
      <div className="hidden md:block" />
    </motion.li>
  );
}

function ProfileChart({ col }: { col: ColumnProfile }) {
  if (col.type === 'date') {
    if (col.min !== undefined && col.max !== undefined) {
      return (
        <p className="truncate type-mono-tiny text-[color:var(--color-ink-muted)]">
          <span className="text-[color:var(--color-ink)]">{String(col.min)}</span>
          <span className="mx-1.5 text-[color:var(--color-ink-faint)]">→</span>
          <span className="text-[color:var(--color-ink)]">{String(col.max)}</span>
        </p>
      );
    }
    return (
      <p className="truncate type-mono-tiny text-[color:var(--color-ink-faint)]">
        {col.sample.slice(0, 3).join(' · ')}
      </p>
    );
  }

  if (col.type === 'number' && col.histogram && col.histogram.length > 0) {
    const buckets: number[] = Array(10).fill(0);
    for (const b of col.histogram) {
      if (b.bucket >= 0 && b.bucket < 10) buckets[b.bucket] = b.count;
    }
    const maxBucket = Math.max(...buckets, 1);
    return (
      <div className="flex h-6 items-end gap-[2px]" title={`Histogram across ${col.cardinality} distinct values`}>
        {buckets.map((count, i) => {
          const h = (count / maxBucket) * 100;
          return (
            <motion.div
              key={i}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.2 + i * 0.02, duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
              style={{ height: `${Math.max(h, 6)}%`, transformOrigin: 'bottom' }}
              className="flex-1 rounded-sm bg-[color:var(--color-accent)]/40"
            />
          );
        })}
      </div>
    );
  }

  if (col.type === 'number' && col.min !== undefined && col.max !== undefined) {
    return (
      <p className="truncate type-mono-tiny text-[color:var(--color-ink-muted)]">
        <span className="text-[color:var(--color-ink)] tabular-nums">{formatNumber(col.min)}</span>
        <span className="mx-1.5 text-[color:var(--color-ink-faint)]">→</span>
        <span className="text-[color:var(--color-ink)] tabular-nums">{formatNumber(col.max)}</span>
      </p>
    );
  }

  if (col.topValues && col.topValues.length > 0) {
    const total = col.topValues.reduce((sum, v) => sum + v.count, 0) || 1;
    return (
      <div className="space-y-1">
        {col.topValues.slice(0, 3).map((v, i) => {
          const pct = (v.count / total) * 100;
          return (
            <div key={v.value} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-[11px]">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="truncate type-mono text-[color:var(--color-ink)]">{v.value}</span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.2 + i * 0.05, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                  style={{
                    width: `${Math.max(pct, 4)}%`,
                    transformOrigin: 'left',
                    opacity: 1 - i * 0.2,
                  }}
                  className="h-1 rounded-full bg-[color:var(--color-accent)]/40"
                />
              </div>
              <span className="type-mono-tiny tabular-nums text-[color:var(--color-ink-faint)]">{v.count}</span>
            </div>
          );
        })}
      </div>
    );
  }

  // Fallback — sample values
  return (
    <p className="truncate type-mono-tiny text-[color:var(--color-ink-faint)]">
      {col.sample.slice(0, 3).join(' · ')}
    </p>
  );
}

function formatNumber(v: number | string): string {
  if (typeof v === 'number') return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return String(v);
}
