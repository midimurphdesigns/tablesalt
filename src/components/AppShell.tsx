'use client';

import { useCallback, useState } from 'react';
import { Dropzone } from '@/components/Dropzone';
import { DataPeek } from '@/components/DataPeek';
import { QuestionInput } from '@/components/QuestionInput';
import { AgentResult } from '@/components/AgentResult';
import { EvalScoreboard } from '@/components/EvalScoreboard';
import { loadCsv, runQuery } from '@/lib/duckdb';
import { profileTable } from '@/lib/profile';
import { useAgent } from '@/lib/use-agent';
import type { DatasetProfile } from '@/lib/types';

const SAMPLES: Record<string, string> = {
  nyc311: '/samples/nyc311.csv',
  titanic: '/samples/titanic.csv',
  sales: '/samples/sales.csv',
};

export function AppShell() {
  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [sampleRows, setSampleRows] = useState<Array<Record<string, unknown>>>([]);
  const [prefill, setPrefill] = useState<string | undefined>(undefined);
  const [loadingDataset, setLoadingDataset] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const agent = useAgent();

  const handleFile = useCallback(async (file: File) => {
    setLoadingDataset(true);
    setLoadError(null);
    try {
      await loadCsv(file);
      const p = await profileTable();
      const sample = await runQuery('SELECT * FROM data LIMIT 3');
      setProfile(p);
      setSampleRows(sample.rows);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load CSV');
    } finally {
      setLoadingDataset(false);
    }
  }, []);

  const handleSample = useCallback(async (key: string) => {
    const url = SAMPLES[key];
    if (!url) return;
    setLoadingDataset(true);
    setLoadError(null);
    try {
      const res = await fetch(url);
      const text = await res.text();
      await loadCsv(text);
      const p = await profileTable();
      const sample = await runQuery('SELECT * FROM data LIMIT 3');
      setProfile(p);
      setSampleRows(sample.rows);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load sample');
    } finally {
      setLoadingDataset(false);
    }
  }, []);

  const handleAsk = useCallback(
    async (question: string) => {
      if (!profile) return;
      await agent.ask(question, profile.columns, profile.rowCount, sampleRows);
    },
    [agent, profile, sampleRows],
  );

  return (
    <main className="container-edge py-16 md:py-24">
      {/* Hero */}
      {/* Top links — always visible, mono-tiny, hover-cyan */}
      <nav className="mb-12 flex flex-wrap items-center gap-x-5 gap-y-2 type-mono-tiny">
        <a
          href="https://github.com/midimurphdesigns/tablesalt"
          target="_blank"
          rel="noreferrer"
          className="text-[color:var(--color-ink-muted)] transition-colors hover:text-[color:var(--color-accent)]"
        >
          github ↗
        </a>
        <span className="text-[color:var(--color-ink-faint)]">·</span>
        <a
          href="https://kevinmurphywebdev.com/blog/building-tablesalt"
          target="_blank"
          rel="noreferrer"
          className="text-[color:var(--color-ink-muted)] transition-colors hover:text-[color:var(--color-accent)]"
        >
          read the blog post ↗
        </a>
        <span className="text-[color:var(--color-ink-faint)]">·</span>
        <a
          href="https://www.npmjs.com/package/streamfield"
          target="_blank"
          rel="noreferrer"
          className="text-[color:var(--color-ink-muted)] transition-colors hover:text-[color:var(--color-accent)]"
        >
          streamfield on npm ↗
        </a>
        <span className="text-[color:var(--color-ink-faint)]">·</span>
        <a
          href="https://kevinmurphywebdev.com"
          target="_blank"
          rel="noreferrer"
          className="text-[color:var(--color-ink-muted)] transition-colors hover:text-[color:var(--color-accent)]"
        >
          made by kevin murphy ↗
        </a>
      </nav>

      <header className="mb-16 max-w-[72ch]">
        <p className="eyebrow">tablesalt</p>
        <h1 className="type-display mt-6 text-[clamp(48px,8vw,96px)] text-[color:var(--color-ink)]">
          Drop a CSV.
          <br />
          Ask a question.
          <br />
          <span className="text-[color:var(--color-accent)]">See generative UI.</span>
        </h1>
        <div className="mt-8 max-w-[60ch] type-mono text-[color:var(--color-ink-muted)] [&>p+p]:mt-4">
          <p>
            Drop a CSV. The agent profiles your data, picks the right kind of
            answer for each question — a chart, a stat card, a table — and
            renders it with motion that&apos;s load-bearing instead of decorative.
            No upload, no backend, no signup. Everything runs in your browser.
          </p>
          <p>
            I built this to show four things in one place: that an AI agent
            can produce useful product UI, not just text; that its accuracy
            can be measured with a real eval harness running live (scroll
            down and press the button); that streaming UIs can feel
            intentional instead of janky (powered by{' '}
            <a
              href="https://github.com/midimurphdesigns/streamfield"
              className="text-[color:var(--color-ink)] underline decoration-[color:var(--color-ink-faint)] underline-offset-4 transition-colors hover:text-[color:var(--color-accent)] hover:decoration-[color:var(--color-accent)]"
            >
              streamfield
            </a>
            , a primitive I extracted and published to npm); and that the
            whole thing can ship with zero backend.
          </p>
        </div>
      </header>

      {/* Load surface */}
      {!profile && (
        <div className="space-y-6">
          <Dropzone onFile={handleFile} onSample={handleSample} />
          {loadingDataset && (
            <p className="type-mono text-[color:var(--color-accent)]">parsing your data…</p>
          )}
          {loadError && (
            <p className="rounded-lg border border-[color:var(--color-fail)]/30 bg-[color:var(--color-fail)]/5 px-4 py-3 type-mono text-[color:var(--color-fail)]">
              {loadError}
            </p>
          )}
        </div>
      )}

      {/* Loaded — schema + question + result */}
      {profile && (
        <div className="space-y-8">
          <DataPeek
            profile={profile}
            onSuggested={(q) => {
              setPrefill(q);
              handleAsk(q);
            }}
          />

          <QuestionInput
            onAsk={handleAsk}
            disabled={agent.status === 'thinking' || agent.status === 'executing'}
            prefill={prefill}
          />

          <AgentResult
            status={agent.status}
            partial={agent.partial}
            result={agent.result}
            latencyMs={agent.latencyMs}
            error={agent.error}
          />

          <button
            type="button"
            onClick={() => {
              setProfile(null);
              setSampleRows([]);
              setPrefill(undefined);
              agent.reset();
            }}
            className="type-mono-tiny text-[color:var(--color-ink-faint)] transition-colors hover:text-[color:var(--color-accent)]"
          >
            ← load a different dataset
          </button>
        </div>
      )}

      {/* Eval scoreboard — visible always, even before loading data */}
      <div className="mt-24">
        <EvalScoreboard />
      </div>

      {/* Colophon */}
      <footer className="mt-24 border-t border-[color:var(--color-divider)] pt-8">
        <p className="type-mono text-[color:var(--color-ink-muted)]">
          tablesalt · made by{' '}
          <a
            href="https://kevinmurphywebdev.com"
            className="text-[color:var(--color-ink)] underline decoration-[color:var(--color-ink-faint)] underline-offset-4 transition-colors hover:text-[color:var(--color-accent)] hover:decoration-[color:var(--color-accent)]"
          >
            Kevin Murphy
          </a>{' '}
          · open source on{' '}
          <a
            href="https://github.com/midimurphdesigns/tablesalt"
            target="_blank"
            rel="noreferrer"
            className="text-[color:var(--color-ink)] underline decoration-[color:var(--color-ink-faint)] underline-offset-4 transition-colors hover:text-[color:var(--color-accent)] hover:decoration-[color:var(--color-accent)]"
          >
            GitHub
          </a>
        </p>
      </footer>
    </main>
  );
}
