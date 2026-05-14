'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { AgentResponse, QueryResult } from '@/lib/types';
import { ReasoningSteps } from './ReasoningSteps';
import { TableRender } from './renders/TableRender';
import { BarRender } from './renders/BarRender';
import { LineRender } from './renders/LineRender';
import { StatRender } from './renders/StatRender';
import { ListRender } from './renders/ListRender';

type Props = {
  status: 'idle' | 'thinking' | 'executing' | 'complete' | 'error';
  partial: Partial<AgentResponse>;
  result: QueryResult | null;
  latencyMs: number | null;
  error: string | null;
};

// Pacing budget — how long after the stream completes before the
// answer reveals. Lowered to 1200ms so the result lands quickly even
// if the model streamed the steps all in one final burst.
const REVEAL_BUDGET_MS = 1200;

export function AgentResult({ status, partial, result, latencyMs, error }: Props) {
  // Gate the answer on the reasoning trace finishing its paced reveal.
  // Without this, the chart pops in instantly the moment the model
  // finishes — the whole "watch the agent think" moment evaporates.
  const [readyToShowAnswer, setReadyToShowAnswer] = useState(false);

  useEffect(() => {
    if (status !== 'complete') {
      setReadyToShowAnswer(false);
      return;
    }
    const t = setTimeout(() => setReadyToShowAnswer(true), REVEAL_BUDGET_MS);
    return () => clearTimeout(t);
  }, [status]);

  if (status === 'idle') return null;

  // Defensive fallback: if the model emitted 'bar'/'line' but the SQL
  // returned ≠2 columns (e.g., a multi-GROUP BY crosstab), the numeric
  // axis would be a string and the chart would render NaN. Fall through
  // to 'table' so the user sees real values instead of broken bars.
  const rawKind = partial.renderKind;
  const colCount = result?.columns.length ?? 0;
  const effectiveKind =
    (rawKind === 'bar' || rawKind === 'line') && colCount !== 2 ? 'table' : rawKind;

  const showAnswer = status === 'complete' && result && effectiveKind && readyToShowAnswer;
  const showThinking = status === 'thinking' || status === 'executing' || (status === 'complete' && !readyToShowAnswer);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="surface relative overflow-hidden p-6 md:p-8"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-3 left-0 w-px bg-[color:var(--color-accent)]/40"
      />

      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="eyebrow">
          {status === 'thinking' && 'thinking…'}
          {status === 'executing' && 'running query…'}
          {status === 'complete' && !readyToShowAnswer && 'composing answer…'}
          {status === 'complete' && readyToShowAnswer && 'answer'}
          {status === 'error' && 'error'}
        </p>
        {latencyMs !== null && status === 'complete' && readyToShowAnswer && (
          <p className="type-mono-tiny text-[color:var(--color-ink-faint)]">{latencyMs} ms</p>
        )}
      </header>

      {/* ANSWER FIRST — the chart / stat / table is the point. */}
      <AnimatePresence mode="wait">
        {showAnswer && (
          <motion.div
            key={effectiveKind}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-5"
          >
            {/* Big caption above the answer */}
            {partial.renderHint && (
              <p className="mb-5 max-w-[60ch] text-[clamp(20px,2.4vw,28px)] leading-[1.25] text-[color:var(--color-ink)]">
                {partial.renderHint}
              </p>
            )}
            {effectiveKind === 'table' && result && <TableRender result={result} />}
            {effectiveKind === 'bar' && result && <BarRender result={result} />}
            {effectiveKind === 'line' && result && <LineRender result={result} />}
            {effectiveKind === 'stat' && result && <StatRender result={result} />}
            {effectiveKind === 'list' && result && <ListRender result={result} />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* While thinking — reasoning trace is the visible content. */}
      {showThinking && (
        <div className="mt-5">
          <ReasoningSteps steps={partial.steps ?? []} />
        </div>
      )}

      {/* After complete — collapsible "how I got there". */}
      {status === 'complete' && partial.steps && partial.steps.length > 0 && (
        <details className="group mt-8 border-t border-[color:var(--color-divider)] pt-5">
          <summary className="flex cursor-pointer items-center gap-2 type-mono-tiny text-[color:var(--color-ink-faint)] transition-colors hover:text-[color:var(--color-accent)]">
            <span className="inline-block transition-transform group-open:rotate-90">›</span>
            how the agent got there
          </summary>
          <div className="mt-5">
            <ReasoningSteps steps={partial.steps} immediate />
          </div>
          {partial.sql && (
            <div className="mt-6">
              <p className="type-mono-tiny mb-2 text-[color:var(--color-ink-faint)]">sql</p>
              <pre className="overflow-x-auto rounded-lg border border-[color:var(--color-divider)] bg-[color:var(--color-canvas)] p-4 text-[12px] leading-[1.6] text-[color:var(--color-ink-muted)]">
                <code>{partial.sql}</code>
              </pre>
            </div>
          )}
        </details>
      )}

      {status === 'error' && error && (
        <div className="mt-5 rounded-lg border border-[color:var(--color-fail)]/30 bg-[color:var(--color-fail)]/5 px-4 py-3">
          <p className="type-mono text-[color:var(--color-fail)]">{error}</p>
          {partial.sql && (
            <details className="mt-3">
              <summary className="cursor-pointer type-mono-tiny text-[color:var(--color-ink-faint)] hover:text-[color:var(--color-accent)]">
                sql the agent tried
              </summary>
              <pre className="mt-2 overflow-x-auto rounded border border-[color:var(--color-divider)] bg-[color:var(--color-canvas)] p-3 text-[12px] text-[color:var(--color-ink-muted)]">
                <code>{partial.sql}</code>
              </pre>
            </details>
          )}
        </div>
      )}
    </motion.section>
  );
}
