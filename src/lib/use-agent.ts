'use client';

import { useCallback, useState } from 'react';
import type { AgentResponse, ColumnProfile, QueryResult, RenderKind } from './types';
import { runQuery } from './duckdb';
import { assertReadOnlySql } from './sql-guard';

type Status = 'idle' | 'thinking' | 'executing' | 'complete' | 'error';

type AgentState = {
  status: Status;
  partial: Partial<AgentResponse>;
  result: QueryResult | null;
  latencyMs: number | null;
  error: string | null;
};

const initialState: AgentState = {
  status: 'idle',
  partial: {},
  result: null,
  latencyMs: null,
  error: null,
};

export function useAgent() {
  const [state, setState] = useState<AgentState>(initialState);

  const ask = useCallback(
    async (question: string, columns: ColumnProfile[], rowCount: number, sampleRows?: Array<Record<string, unknown>>) => {
      const startedAt = performance.now();
      setState({ ...initialState, status: 'thinking', partial: {} });

      try {
        const res = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ question, columns, rowCount, sampleRows }),
        });
        if (!res.ok || !res.body) throw new Error(`Agent request failed: ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // streamObject emits a sequence of JSON snapshots. The Vercel
          // AI SDK uses partialObjectStream framing under the hood; in
          // text-stream mode we get one valid JSON per chunk by the end
          // but the raw text is accumulating. Attempt to parse the
          // buffer as JSON on every read — when it parses, surface as
          // partial. (Loose; intended for demo-grade responsiveness.)
          try {
            const obj = JSON.parse(buffer) as Partial<AgentResponse>;
            setState((s) => ({ ...s, partial: obj }));
          } catch {
            // not yet a valid snapshot; keep accumulating.
          }
        }

        // Final parse.
        const final = JSON.parse(buffer) as AgentResponse;
        const safeSql = assertReadOnlySql(final.sql);

        setState((s) => ({ ...s, status: 'executing', partial: final }));
        const result = await runQuery(safeSql);

        setState({
          status: 'complete',
          partial: final,
          result,
          latencyMs: Math.round(performance.now() - startedAt),
          error: null,
        });
      } catch (err) {
        setState((s) => ({
          ...s,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
          latencyMs: Math.round(performance.now() - startedAt),
        }));
      }
    },
    [],
  );

  const reset = useCallback(() => setState(initialState), []);

  return { ...state, ask, reset };
}

export type { Status, RenderKind };
