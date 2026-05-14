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
    async (
      question: string,
      columns: ColumnProfile[],
      rowCount: number,
      sampleRows?: Array<Record<string, unknown>>,
    ) => {
      const startedAt = performance.now();
      setState({ ...initialState, status: 'thinking', partial: {} });

      try {
        const res = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ question, columns, rowCount, sampleRows }),
        });
        if (!res.ok || !res.body) {
          const errText = await res.text();
          throw new Error(errText || `Agent request failed: ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let lastSnapshot: Partial<AgentResponse> = {};

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Parse newline-delimited JSON snapshots. Each line is the
          // full partial-object so far; we replace state with the
          // latest valid snapshot to trigger re-renders.
          let nlIndex = buffer.indexOf('\n');
          while (nlIndex !== -1) {
            const line = buffer.slice(0, nlIndex).trim();
            buffer = buffer.slice(nlIndex + 1);
            nlIndex = buffer.indexOf('\n');
            if (!line) continue;
            try {
              const snapshot = JSON.parse(line);
              if (snapshot && typeof snapshot === 'object' && '__error' in snapshot) {
                throw new Error(String(snapshot.__error));
              }
              lastSnapshot = snapshot;
              setState((s) => ({ ...s, partial: snapshot }));
            } catch (err) {
              // Re-throw genuine stream errors. Skip parse errors from
              // partial JSON only.
              if (err instanceof Error && err.message.startsWith('Unexpected') === false) {
                throw err;
              }
            }
          }
        }

        // Tail buffer — final snapshot.
        if (buffer.trim()) {
          try {
            const snapshot = JSON.parse(buffer.trim());
            lastSnapshot = snapshot;
          } catch {
            // ignore
          }
        }

        if (!lastSnapshot.sql || !lastSnapshot.renderKind) {
          // Surface whatever the model managed to produce so the user
          // can see WHY the answer didn't render — usually the model
          // refused or asked for clarification mid-stream.
          const reasoning = lastSnapshot.reasoning?.trim();
          const detail = reasoning
            ? `The model responded with text instead of a query: "${reasoning.slice(0, 200)}"`
            : "The model didn't return a query for that question. Try rephrasing — be specific about which column you want to aggregate.";
          throw new Error(detail);
        }

        const safeSql = assertReadOnlySql(lastSnapshot.sql);

        setState((s) => ({ ...s, status: 'executing', partial: lastSnapshot }));
        const result = await runQuery(safeSql);

        setState({
          status: 'complete',
          partial: lastSnapshot,
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
