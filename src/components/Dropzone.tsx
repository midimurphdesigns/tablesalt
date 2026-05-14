'use client';

import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';

type Props = {
  onFile: (file: File) => void;
  onSample: (key: string) => void;
};

export function Dropzone({ onFile, onSample }: Props) {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  return (
    <div className="relative">
      <motion.div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        animate={{
          borderColor: over ? 'rgba(77,255,255,0.6)' : 'rgba(31,31,35,1)',
          boxShadow: over
            ? '0 0 32px rgba(77,255,255,0.18)'
            : '0 0 0 rgba(77,255,255,0)',
        }}
        transition={{ duration: 0.2 }}
        className="surface flex cursor-pointer flex-col items-center justify-center gap-3 px-6 py-16 text-center transition-colors hover:border-[color:var(--color-accent)]/40"
        style={{ borderStyle: 'dashed' }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv,application/json,.jsonl"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
          }}
        />
        <p className="type-display text-[clamp(28px,3.4vw,42px)] text-[color:var(--color-ink)]">
          drop a CSV
        </p>
        <p className="type-mono text-[color:var(--color-ink-muted)]">
          or click to choose a file · runs entirely in your browser
        </p>
      </motion.div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="type-mono-tiny text-[color:var(--color-ink-faint)]">try a sample</span>
        {[
          { key: 'nyc311', label: 'NYC 311', file: 'nyc311.csv' },
          { key: 'titanic', label: 'Titanic', file: 'titanic.csv' },
          { key: 'sales', label: 'SaaS sales', file: 'sales.csv' },
        ].map((s) => (
          <span key={s.key} className="inline-flex items-stretch overflow-hidden rounded-full border border-[color:var(--color-divider)] transition-colors hover:border-[color:var(--color-accent)]">
            <button
              type="button"
              onClick={() => onSample(s.key)}
              className="px-3 py-1 type-mono text-[color:var(--color-ink-muted)] transition-colors hover:text-[color:var(--color-accent)]"
            >
              {s.label}
            </button>
            <a
              href={`/samples/${s.file}`}
              download
              onClick={(e) => e.stopPropagation()}
              aria-label={`Download ${s.label} CSV`}
              className="border-l border-[color:var(--color-divider)] px-2.5 py-1 type-mono-tiny text-[color:var(--color-ink-faint)] transition-colors hover:bg-[color:var(--color-accent)]/10 hover:text-[color:var(--color-accent)]"
              title={`Download ${s.label} CSV`}
            >
              ↓
            </a>
          </span>
        ))}
      </div>
    </div>
  );
}
