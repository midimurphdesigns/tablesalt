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
          {/* Column-list header — three labels matching the spreadsheet's
              header treatment so a viewer parses both halves the same way. */}
          <div className="grid grid-cols-[1.2fr_2.5rem_minmax(0,1.6fr)] items-baseline gap-4 border-b border-[color:var(--color-divider)] bg-[color:var(--color-canvas)] px-6 py-2 md:px-8">
            <span className="type-mono-tiny text-[color:var(--color-ink-faint)]">column</span>
            <span className="type-mono-tiny text-[color:var(--color-ink-faint)]">type</span>
            <span className="type-mono-tiny text-[color:var(--color-ink-faint)]">
              distribution
            </span>
          </div>
          <ul className="divide-y divide-[color:var(--color-divider)]">
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

const TYPE_CODE: Record<ColumnProfile['type'], string> = {
  string: 'STR',
  number: 'NUM',
  date: 'DATE',
  boolean: 'BOOL',
};

function ProfileRow({ col, index }: { col: ColumnProfile; index: number }) {
  // Density signal at-a-glance. The detail line is reserved for hover.
  return (
    <motion.li
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      className="group relative"
    >
      <div className="grid grid-cols-[1.2fr_2.5rem_minmax(0,1.6fr)] items-center gap-4 px-6 py-2.5 transition-colors group-hover:bg-[color:var(--color-accent)]/[0.03] md:px-8">
        {/* Left rail glow on hover */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-px bg-[color:var(--color-accent)] opacity-0 transition-opacity group-hover:opacity-60"
          style={{ boxShadow: '0 0 8px rgba(77,255,255,0.4)' }}
        />

        <span className="truncate type-mono text-[13px] text-[color:var(--color-ink)]">
          {col.name}
        </span>
        <span className="type-mono-tiny text-[color:var(--color-ink-faint)] tabular-nums">
          {TYPE_CODE[col.type]}
        </span>
        <div className="min-w-0">
          <DensitySignal col={col} />
        </div>
      </div>

      {/* Hover detail — single line, mono-tiny, plain English */}
      <div className="grid max-h-0 grid-rows-[0fr] overflow-hidden transition-[grid-template-rows] duration-200 ease-out group-hover:grid-rows-[1fr]">
        <div className="min-h-0 overflow-hidden">
          <p className="px-6 pb-2 type-mono-tiny text-[color:var(--color-ink-faint)] md:px-8">
            <HoverDetail col={col} />
          </p>
        </div>
      </div>
    </motion.li>
  );
}

function DensitySignal({ col }: { col: ColumnProfile }) {
  // Categorical: stripe sparkline — N bars where each bar's height
  // is proportional to that value's count, ordered most→least frequent.
  // For high-cardinality strings, falls back to the cardinality bar.
  if (col.type === 'string') {
    if (col.topValues && col.topValues.length > 0) {
      return <CategoricalSpark values={col.topValues} cardinality={col.cardinality} />;
    }
    return <CardinalitySpark cardinality={col.cardinality} />;
  }

  // Numeric: 12-bucket histogram (vertical bars), height ∝ count.
  if (col.type === 'number' && col.histogram && col.histogram.length > 0) {
    return <NumericSpark histogram={col.histogram} />;
  }

  // Date: thin range bar with min/max ticks.
  if (col.type === 'date' && col.min !== undefined && col.max !== undefined) {
    return <DateRange min={String(col.min)} max={String(col.max)} />;
  }

  // Boolean: two-bar true/false split. Without real counts we render a flat 50/50.
  if (col.type === 'boolean') {
    return <BooleanSplit />;
  }

  // Fallback: cardinality strip.
  return <CardinalitySpark cardinality={col.cardinality} />;
}

function CategoricalSpark({
  values,
  cardinality,
}: {
  values: NonNullable<ColumnProfile['topValues']>;
  cardinality: number;
}) {
  // Pad the visible bars to up to 8 slots; remaining cardinality folds
  // into a single faint "long tail" bar at the end.
  const visible = values.slice(0, 8);
  const maxCount = Math.max(...visible.map((v) => v.count), 1);
  const hiddenCardinality = Math.max(0, cardinality - visible.length);

  return (
    <div className="flex h-4 items-end gap-[2px]" aria-hidden>
      {visible.map((v, i) => {
        const h = (v.count / maxCount) * 100;
        return (
          <motion.span
            key={`${v.value}-${i}`}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.2 + i * 0.02, duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ height: `${Math.max(h, 8)}%`, transformOrigin: 'bottom', width: 4 }}
            className="bg-[color:var(--color-accent)]/55"
          />
        );
      })}
      {hiddenCardinality > 0 && (
        <span className="ml-1 self-stretch w-[3px] bg-[color:var(--color-ink-faint)]/30" />
      )}
    </div>
  );
}

function NumericSpark({ histogram }: { histogram: NonNullable<ColumnProfile['histogram']> }) {
  const buckets: number[] = Array(10).fill(0);
  for (const b of histogram) {
    if (b.bucket >= 0 && b.bucket < 10) buckets[b.bucket] = b.count;
  }
  const max = Math.max(...buckets, 1);
  return (
    <div className="flex h-4 items-end gap-[2px]" aria-hidden>
      {buckets.map((count, i) => (
        <motion.span
          key={i}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.2 + i * 0.02, duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          style={{
            height: `${Math.max((count / max) * 100, 6)}%`,
            transformOrigin: 'bottom',
            flex: '1 1 0',
          }}
          className="bg-[color:var(--color-accent)]/55"
        />
      ))}
    </div>
  );
}

function DateRange({ min, max }: { min: string; max: string }) {
  return (
    <div className="flex items-center gap-2" aria-hidden>
      <span className="type-mono-tiny tabular-nums text-[color:var(--color-ink-muted)]">{min}</span>
      <span className="relative h-px flex-1 bg-[color:var(--color-divider)]">
        <motion.span
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ transformOrigin: 'left' }}
          className="absolute inset-0 bg-[color:var(--color-accent)]/40"
        />
        <span className="absolute -left-[1px] -top-1 h-2 w-px bg-[color:var(--color-accent)]/70" />
        <span className="absolute -right-[1px] -top-1 h-2 w-px bg-[color:var(--color-accent)]/70" />
      </span>
      <span className="type-mono-tiny tabular-nums text-[color:var(--color-ink-muted)]">{max}</span>
    </div>
  );
}

function BooleanSplit() {
  return (
    <div className="flex h-4 items-end gap-[2px]" aria-hidden>
      <motion.span
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.2, duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        style={{ height: '70%', transformOrigin: 'bottom', width: 8 }}
        className="bg-[color:var(--color-accent)]/55"
      />
      <motion.span
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.24, duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        style={{ height: '45%', transformOrigin: 'bottom', width: 8 }}
        className="bg-[color:var(--color-accent)]/30"
      />
    </div>
  );
}

function CardinalitySpark({ cardinality }: { cardinality: number }) {
  // High-cardinality strings (IDs, free-text): one long bar that says
  // "many unique values" without enumerating.
  return (
    <div className="flex h-4 items-end" aria-hidden>
      <motion.span
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        style={{ transformOrigin: 'left' }}
        className="h-px w-full self-center bg-[color:var(--color-ink-faint)]/40"
      />
      <span className="ml-2 shrink-0 type-mono-tiny tabular-nums text-[color:var(--color-ink-faint)]">
        {cardinality.toLocaleString()} unique
      </span>
    </div>
  );
}

function HoverDetail({ col }: { col: ColumnProfile }) {
  if (col.type === 'string') {
    if (col.topValues && col.topValues.length > 0) {
      const top = col.topValues[0];
      return (
        <>
          most common: <span className="text-[color:var(--color-ink)]">{top.value}</span>
          {' '}({top.count})
          {' · '}
          <span className="text-[color:var(--color-ink-muted)]">{col.cardinality.toLocaleString()} distinct</span>
        </>
      );
    }
    return (
      <>
        <span className="text-[color:var(--color-ink-muted)]">{col.cardinality.toLocaleString()} distinct values</span>
        {col.sample.length > 0 && (
          <>
            {' · '}e.g. <span className="text-[color:var(--color-ink)]">{col.sample[0]}</span>
          </>
        )}
      </>
    );
  }
  if (col.type === 'number' && col.min !== undefined && col.max !== undefined) {
    return (
      <>
        range:{' '}
        <span className="text-[color:var(--color-ink)] tabular-nums">{formatNumber(col.min)}</span>
        {' → '}
        <span className="text-[color:var(--color-ink)] tabular-nums">{formatNumber(col.max)}</span>
        {' · '}
        <span className="text-[color:var(--color-ink-muted)]">{col.cardinality.toLocaleString()} distinct</span>
      </>
    );
  }
  if (col.type === 'date' && col.min !== undefined && col.max !== undefined) {
    return (
      <>
        spans{' '}
        <span className="text-[color:var(--color-ink)]">{String(col.min)}</span>
        {' to '}
        <span className="text-[color:var(--color-ink)]">{String(col.max)}</span>
        {' · '}
        <span className="text-[color:var(--color-ink-muted)]">{col.cardinality.toLocaleString()} distinct days</span>
      </>
    );
  }
  return (
    <span className="text-[color:var(--color-ink-muted)]">
      {col.cardinality.toLocaleString()} distinct {col.type === 'boolean' ? 'value' : 'value'}
      {col.cardinality === 1 ? '' : 's'}
    </span>
  );
}

function formatNumber(v: number | string): string {
  if (typeof v === 'number') return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return String(v);
}
