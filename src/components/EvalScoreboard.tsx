'use client';

import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { evalSet } from '@/lib/evals';
import { formatUsd } from '@/lib/pricing';

type CaseState = {
  index: number;
  id: string;
  question: string;
  expected: { sql: string; renderKind: string };
  actual?: { sql: string; renderKind: string };
  latencyMs?: number;
  costUsd?: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  verdict?: { renderKind: boolean; executes: boolean; semanticMatch: boolean };
  error?: string;
  status: 'pending' | 'running' | 'done' | 'error';
};

type Aggregate = {
  total: number;
  renderCorrect: number;
  sqlExecutes: number;
  sqlSemantic: number;
  meanLatencyMs: number;
  totalCostUsd: number;
  model: string;
  finishedAt: number;
};

type RunState = 'idle' | 'running' | 'done' | 'error';

export function EvalScoreboard() {
  const [run, setRun] = useState<RunState>('idle');
  const [cases, setCases] = useState<CaseState[]>([]);
  const [aggregate, setAggregate] = useState<Aggregate | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);

  const start = useCallback(async () => {
    setRun('running');
    setErrorMsg(null);
    setAggregate(null);
    setCases([]);

    try {
      const res = await fetch('/api/eval', { method: 'POST' });
      if (!res.ok || !res.body) {
        const msg = await res.text();
        setErrorMsg(msg || `eval request failed (${res.status})`);
        setRun('error');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          let event;
          try {
            event = JSON.parse(line);
          } catch {
            continue;
          }

          if (event.kind === 'start') {
            setModel(event.model);
            setCases(
              evalSet.map((c, i) => ({
                index: i,
                id: c.id,
                question: c.question,
                expected: { sql: c.expectedSql, renderKind: c.expectedRenderKind },
                status: 'pending' as const,
              })),
            );
          } else if (event.kind === 'case-start') {
            setCases((prev) => prev.map((c) => (c.index === event.index ? { ...c, status: 'running' } : c)));
          } else if (event.kind === 'case-done') {
            setCases((prev) =>
              prev.map((c) =>
                c.index === event.index
                  ? {
                      ...c,
                      status: 'done',
                      actual: event.actual,
                      latencyMs: event.latencyMs,
                      costUsd: event.costUsd,
                      inputTokens: event.inputTokens,
                      outputTokens: event.outputTokens,
                      verdict: event.verdict,
                    }
                  : c,
              ),
            );
          } else if (event.kind === 'case-error') {
            setCases((prev) =>
              prev.map((c) =>
                c.index === event.index ? { ...c, status: 'error', error: event.error, latencyMs: event.latencyMs } : c,
              ),
            );
          } else if (event.kind === 'done') {
            setAggregate({
              total: event.total,
              renderCorrect: event.renderCorrect,
              sqlExecutes: event.sqlExecutes,
              sqlSemantic: event.sqlSemantic,
              meanLatencyMs: event.meanLatencyMs,
              totalCostUsd: event.totalCostUsd ?? 0,
              model: event.model,
              finishedAt: event.finishedAt,
            });
            setRun('done');
          }
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'unknown error');
      setRun('error');
    }
  }, []);

  return (
    <section className="surface relative overflow-hidden p-6 md:p-8">
      <span aria-hidden className="absolute inset-y-3 left-0 w-px bg-[color:var(--color-accent)]/40" />

      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="type-h2">The eval scoreboard.</h2>
        {model && (
          <p className="type-mono-tiny text-[color:var(--color-ink-faint)]">
            {model} · {evalSet.length} labeled cases · NYC 311 corpus
          </p>
        )}
      </header>

      <p className="mt-4 max-w-[60ch] type-mono text-[color:var(--color-ink-muted)]">
        Most AI-for-data demos hide their accuracy numbers. Click the button and watch all
        {' '}{evalSet.length} cases run against the live model right now — text-to-SQL accuracy
        scored against expected SQL + render kind.
      </p>

      {/* Run button / state */}
      <div className="mt-6">
        {run === 'idle' && (
          <button
            type="button"
            onClick={start}
            className="rounded-lg border border-[color:var(--color-accent)]/40 bg-[color:var(--color-accent)]/10 px-5 py-2.5 type-mono text-[color:var(--color-accent)] transition-all hover:bg-[color:var(--color-accent)]/20"
          >
            ▶ run eval now
          </button>
        )}
        {run === 'running' && (
          <p className="type-mono text-[color:var(--color-accent)]">
            running {evalSet.length} cases against the live model…
          </p>
        )}
        {run === 'error' && errorMsg && (
          <div className="rounded-lg border border-[color:var(--color-fail)]/30 bg-[color:var(--color-fail)]/5 px-4 py-3 type-mono text-[color:var(--color-fail)]">
            {errorMsg}
            <button
              type="button"
              onClick={start}
              className="ml-3 underline underline-offset-4 hover:no-underline"
            >
              retry
            </button>
          </div>
        )}
      </div>

      {/* Aggregate stat cards — render after done */}
      {aggregate && (
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { label: 'render-kind correct', value: aggregate.renderCorrect, total: aggregate.total },
            { label: 'sql executes', value: aggregate.sqlExecutes, total: aggregate.total },
            { label: 'sql semantic match', value: aggregate.sqlSemantic, total: aggregate.total },
          ].map((s, i) => {
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
      )}

      {aggregate && (
        <p className="mt-6 type-mono text-[color:var(--color-ink-muted)]">
          Mean latency: <span className="text-[color:var(--color-ink)]">{aggregate.meanLatencyMs} ms</span>
          {' · '}Total cost: <span className="text-[color:var(--color-ink)]">{formatUsd(aggregate.totalCostUsd)}</span>
          {' · '}Per case: <span className="text-[color:var(--color-ink)]">{formatUsd(aggregate.totalCostUsd / Math.max(aggregate.total, 1))}</span>
        </p>
      )}

      {/* Per-case rows — appear as the stream lands */}
      {cases.length > 0 && (
        <ul className="mt-8 space-y-1">
          <AnimatePresence>
            {cases.map((c) => (
              <motion.li
                key={c.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-[1fr_auto_auto_auto_auto] items-baseline gap-3 border-b border-[color:var(--color-divider)] py-2 last:border-0"
              >
                <span className="truncate type-mono text-[color:var(--color-ink)]">
                  {c.question}
                </span>
                <span className="type-mono-tiny text-[color:var(--color-ink-faint)]">
                  {c.latencyMs ? `${c.latencyMs} ms` : c.status === 'running' ? '…' : ''}
                </span>
                <span className="type-mono-tiny text-[color:var(--color-ink-faint)] tabular-nums">
                  {c.costUsd !== undefined && c.costUsd !== null ? formatUsd(c.costUsd) : ''}
                </span>
                <span className="type-mono-tiny">
                  {c.verdict ? (
                    <>
                      <Mark hit={c.verdict.renderKind} label="kind" />
                      <Mark hit={c.verdict.executes} label="run" />
                      <Mark hit={c.verdict.semanticMatch} label="sql" />
                    </>
                  ) : c.status === 'error' ? (
                    <span className="text-[color:var(--color-fail)]">err</span>
                  ) : (
                    <span className="text-[color:var(--color-ink-faint)]">·</span>
                  )}
                </span>
                <span className="type-mono-tiny text-[color:var(--color-ink-faint)]">
                  → {c.expected.renderKind}
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}

function Mark({ hit, label }: { hit: boolean; label: string }) {
  return (
    <span
      className="ml-2 inline-flex items-center gap-1"
      style={{ color: hit ? 'var(--color-pass)' : 'var(--color-fail)' }}
      title={`${label}: ${hit ? 'pass' : 'fail'}`}
    >
      {hit ? '✓' : '✗'} <span className="text-[color:var(--color-ink-faint)]">{label}</span>
    </span>
  );
}
