'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { evalSet } from '@/lib/evals';
import { formatUsd } from '@/lib/pricing';

type CaseState = {
  index: number;
  id: string;
  question: string;
  expected: { sql: string; renderKind: string };
  actual?: { sql: string; renderKind: string };
  partialSql?: string;
  partialRenderKind?: string;
  latencyMs?: number;
  costUsd?: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  verdict?: { renderKind: boolean; executes: boolean; semanticMatch: boolean; answerMatches: boolean };
  error?: string;
  status: 'pending' | 'running' | 'done' | 'error';
};

type Aggregate = {
  total: number;
  renderCorrect: number;
  sqlExecutes: number;
  sqlSemantic: number;
  answerMatches: number;
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
  const [cooldown, setCooldown] = useState<number | null>(null);
  const [model, setModel] = useState<string | null>(null);

  // Countdown for rate-limit cooldown — refreshes every second.
  useEffect(() => {
    if (cooldown === null || cooldown <= 0) return;
    const t = setInterval(() => {
      setCooldown((c) => (c === null ? null : Math.max(0, c - 1)));
    }, 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const start = useCallback(async () => {
    setRun('running');
    setErrorMsg(null);
    setAggregate(null);
    setCases([]);

    try {
      const res = await fetch('/api/eval', { method: 'POST' });
      if (!res.ok || !res.body) {
        const raw = await res.text();
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.error === 'rate-limited') {
            setErrorMsg(parsed.message ?? "You've hit the eval rate limit.");
            setCooldown(Number(parsed.retryAfterSeconds) || null);
          } else {
            setErrorMsg(parsed?.message ?? raw ?? `eval request failed (${res.status})`);
          }
        } catch {
          setErrorMsg(raw || `eval request failed (${res.status})`);
        }
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
          } else if (event.kind === 'case-partial') {
            setCases((prev) =>
              prev.map((c) =>
                c.index === event.index
                  ? {
                      ...c,
                      partialSql: event.partial?.sql,
                      partialRenderKind: event.partial?.renderKind,
                    }
                  : c,
              ),
            );
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
              answerMatches: event.answerMatches ?? 0,
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
        Most AI-for-data demos hide their accuracy. Click the button and {evalSet.length} hand-labeled
        questions run against the live model now. Each case is scored on three things —
        does it pick the right rendering, does the SQL execute, and does the SQL return the same
        answer as the reference query.
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
            <p>{errorMsg}</p>
            {cooldown !== null && cooldown > 0 ? (
              <p className="mt-1 type-mono-tiny text-[color:var(--color-ink-muted)]">
                ready again in {formatCountdown(cooldown)}
              </p>
            ) : (
              <button
                type="button"
                onClick={start}
                className="mt-2 inline-block underline underline-offset-4 hover:no-underline"
              >
                retry
              </button>
            )}
          </div>
        )}
      </div>

      {/* Aggregate stat cards — render after done. Three headline metrics
          in priority order. 'Answer matches' is the metric a hiring
          manager actually cares about: did the agent get the right
          numbers? */}
      {aggregate && (
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              label: 'answer matches',
              hint: 'Agent SQL returns the same rows as the reference query.',
              value: aggregate.answerMatches,
              total: aggregate.total,
            },
            {
              label: 'render kind correct',
              hint: 'Agent picked the right output shape (chart / stat / table / list).',
              value: aggregate.renderCorrect,
              total: aggregate.total,
            },
            {
              label: 'sql executes',
              hint: 'SQL parses and runs without error against the corpus.',
              value: aggregate.sqlExecutes,
              total: aggregate.total,
            },
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
                <p className="mt-3 max-w-[28ch] type-mono-tiny leading-[1.4] text-[color:var(--color-ink-muted)]">
                  {s.hint}
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
          {' · '}Exact SQL phrasing match (stricter): <span className="text-[color:var(--color-ink)]">{Math.round((aggregate.sqlSemantic / aggregate.total) * 100)}%</span>
        </p>
      )}

      {/* Per-case rows — appear as the stream lands */}
      {cases.length > 0 && (
        <div className="mt-8">
          {/* Column header — clarifies the cryptic marks */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-baseline gap-3 border-b border-[color:var(--color-divider)] pb-2 text-[color:var(--color-ink-faint)]">
            <span className="eyebrow">question</span>
            <span className="eyebrow">latency</span>
            <span className="eyebrow">cost</span>
            <span className="eyebrow">render · runs · answer</span>
            <span className="eyebrow">expected</span>
          </div>
          <ul className="space-y-1">
            <AnimatePresence>
            {cases.map((c) => (
              <motion.li
                key={c.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="border-b border-[color:var(--color-divider)] py-2 last:border-0"
              >
                <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-baseline gap-3">
                  <span className="truncate type-mono text-[color:var(--color-ink)]">
                    {c.question}
                  </span>
                  <span className="type-mono-tiny text-[color:var(--color-ink-faint)] tabular-nums">
                    {c.latencyMs ? `${c.latencyMs} ms` : c.status === 'running' ? '…' : ''}
                  </span>
                  <span className="type-mono-tiny text-[color:var(--color-ink-faint)] tabular-nums">
                    {c.costUsd !== undefined && c.costUsd !== null ? formatUsd(c.costUsd) : ''}
                  </span>
                  <span className="type-mono-tiny tabular-nums">
                    {c.verdict ? (
                      <span className="inline-flex gap-2">
                        <Mark hit={c.verdict.renderKind} title="Render kind matches the expected output shape." />
                        <Mark hit={c.verdict.executes} title="SQL parses and executes against the corpus." />
                        <Mark hit={c.verdict.answerMatches} title="Result rows match the reference query's rows." />
                      </span>
                    ) : c.status === 'error' ? (
                      <span className="text-[color:var(--color-fail)]">err</span>
                    ) : (
                      <span className="text-[color:var(--color-ink-faint)]">·</span>
                    )}
                  </span>
                  <span className="type-mono-tiny text-[color:var(--color-ink-faint)]">
                    {c.expected.renderKind}
                  </span>
                </div>
                {c.status === 'running' && c.partialSql && (
                  <p className="mt-1 truncate type-mono-tiny text-[color:var(--color-accent)]/70">
                    {c.partialSql}
                  </p>
                )}
                {c.error && (
                  <p className="mt-1 truncate type-mono-tiny text-[color:var(--color-fail)]/80">
                    {c.error}
                  </p>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
          </ul>
        </div>
      )}
    </section>
  );
}

function formatCountdown(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem === 0 ? `${m}m` : `${m}m ${rem}s`;
}

function Mark({ hit, title }: { hit: boolean; title: string }) {
  return (
    <span
      className="inline-block w-4 text-center"
      style={{ color: hit ? 'var(--color-pass)' : 'var(--color-fail)' }}
      title={title}
      aria-label={title}
    >
      {hit ? '✓' : '✗'}
    </span>
  );
}
