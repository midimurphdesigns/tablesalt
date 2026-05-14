'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { AgentResponse, QueryResult } from '@/lib/types';
import { StreamingReasoning } from './renders/StreamingReasoning';
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

export function AgentResult({ status, partial, result, latencyMs, error }: Props) {
  if (status === 'idle') return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="surface relative overflow-hidden p-6 md:p-8"
    >
      {/* Cyan left rail */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-3 left-0 w-px bg-[color:var(--color-accent)]/40"
      />

      <header className="flex items-baseline justify-between">
        <p className="eyebrow">
          {status === 'thinking' && 'thinking…'}
          {status === 'executing' && 'running query…'}
          {status === 'complete' && 'result'}
          {status === 'error' && 'error'}
        </p>
        {latencyMs !== null && status === 'complete' && (
          <p className="type-mono-tiny text-[color:var(--color-ink-faint)]">{latencyMs} ms</p>
        )}
      </header>

      {/* Reasoning — streams in field-by-field */}
      {partial.reasoning && (
        <div className="mt-4">
          <StreamingReasoning text={partial.reasoning} />
        </div>
      )}

      {/* Render hint caption */}
      {status === 'complete' && partial.renderHint && (
        <p className="mt-6 type-mono text-[color:var(--color-ink-muted)]">
          {partial.renderHint}
        </p>
      )}

      {/* The rendered result */}
      <AnimatePresence mode="wait">
        {status === 'complete' && result && partial.renderKind && (
          <motion.div
            key={partial.renderKind}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mt-4"
          >
            {partial.renderKind === 'table' && <TableRender result={result} />}
            {partial.renderKind === 'bar' && <BarRender result={result} />}
            {partial.renderKind === 'line' && <LineRender result={result} />}
            {partial.renderKind === 'stat' && <StatRender result={result} />}
            {partial.renderKind === 'list' && <ListRender result={result} />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* SQL inspector — collapsible */}
      {partial.sql && (
        <details className="mt-8 group">
          <summary className="cursor-pointer type-mono-tiny text-[color:var(--color-ink-faint)] hover:text-[color:var(--color-accent)] transition-colors">
            sql ↗
          </summary>
          <pre className="mt-3 overflow-x-auto rounded-lg border border-[color:var(--color-divider)] bg-[color:var(--color-canvas)] p-4 text-[12px] leading-[1.6] text-[color:var(--color-ink-muted)]">
            <code>{partial.sql}</code>
          </pre>
        </details>
      )}

      {status === 'error' && error && (
        <p className="mt-4 rounded-lg border border-[color:var(--color-fail)]/30 bg-[color:var(--color-fail)]/5 px-4 py-3 type-mono text-[color:var(--color-fail)]">
          {error}
        </p>
      )}
    </motion.section>
  );
}
