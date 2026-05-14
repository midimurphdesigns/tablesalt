'use client';

import { motion } from 'framer-motion';
import { evalSet, lastRun } from '@/lib/evals';

export function EvalScoreboard() {
  const scores = [
    {
      label: 'render-kind correct',
      value: lastRun.renderKindCorrect,
      total: lastRun.totalCases,
    },
    {
      label: 'sql executes',
      value: lastRun.sqlExecutes,
      total: lastRun.totalCases,
    },
    {
      label: 'sql semantic match',
      value: lastRun.sqlSemanticMatch,
      total: lastRun.totalCases,
    },
  ];

  return (
    <section className="surface relative overflow-hidden p-6 md:p-8">
      <span aria-hidden className="absolute inset-y-3 left-0 w-px bg-[color:var(--color-accent)]/40" />
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="type-h2">The eval scoreboard.</h2>
        <p className="type-mono-tiny text-[color:var(--color-ink-faint)]">
          {lastRun.model} · {lastRun.timestamp} · {evalSet.length} labeled cases · in-browser corpus
        </p>
      </header>

      <p className="mt-4 max-w-[60ch] type-mono text-[color:var(--color-ink-muted)]">
        Most AI-for-data demos hide their accuracy numbers. Here are mine — text-to-SQL accuracy across
        a labeled set of NYC 311 questions, scored against expected SQL + render kind.
      </p>

      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        {scores.map((s, i) => {
          const pct = Math.round((s.value / s.total) * 100);
          return (
            <motion.li
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="rounded-lg border border-[color:var(--color-divider)] bg-[color:var(--color-canvas)] p-5"
            >
              <p className="eyebrow">{s.label}</p>
              <p
                className="mt-3 font-display italic"
                style={{ fontSize: 'clamp(40px,5vw,56px)', lineHeight: 1, color: 'var(--color-accent)' }}
              >
                {pct}%
              </p>
              <p className="mt-2 type-mono-tiny text-[color:var(--color-ink-faint)]">
                {s.value} / {s.total} cases
              </p>
            </motion.li>
          );
        })}
      </ul>

      <p className="mt-6 type-mono text-[color:var(--color-ink-muted)]">
        Mean latency: <span className="text-[color:var(--color-ink)]">{lastRun.meanLatencyMs} ms</span>.
        Known failure modes:{' '}
        <span className="text-[color:var(--color-ink)]">{lastRun.notes}</span>
      </p>

      <details className="mt-6">
        <summary className="cursor-pointer type-mono-tiny text-[color:var(--color-ink-faint)] transition-colors hover:text-[color:var(--color-accent)]">
          see all {evalSet.length} cases ↗
        </summary>
        <ul className="mt-4 space-y-2">
          {evalSet.map((c) => (
            <li key={c.id} className="border-b border-[color:var(--color-divider)] py-2 type-mono text-[color:var(--color-ink-muted)] last:border-0">
              <span className="text-[color:var(--color-ink)]">{c.question}</span>
              <span className="ml-2 type-mono-tiny text-[color:var(--color-ink-faint)]">
                → {c.expectedRenderKind}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
