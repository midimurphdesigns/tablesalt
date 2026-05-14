'use client';

import type { QueryResult } from '@/lib/types';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function StatRender({ result }: { result: QueryResult }) {
  const row = result.rows[0];
  if (!row) return <p className="type-mono text-[color:var(--color-ink-muted)]">No result.</p>;

  // Single-scalar case gets a full-bleed hero treatment. Multiple
  // scalars (rare) fall back to a paired layout.
  if (result.columns.length === 1) {
    const col = result.columns[0];
    const v = row[col];
    return <HeroStat label={col} value={v} />;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {result.columns.map((col, i) => {
        const v = row[col];
        return (
          <motion.div
            key={col}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="rounded-lg border border-[color:var(--color-divider)] bg-[color:var(--color-canvas)] p-6"
          >
            <p className="eyebrow">{col}</p>
            <p
              className="mt-3 font-display italic"
              style={{ fontSize: 'clamp(48px,7vw,88px)', lineHeight: 1, color: 'var(--color-accent)' }}
            >
              {formatVal(v)}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string | number | null }) {
  const target = typeof value === 'number' ? value : null;
  const displayString = target === null ? String(value ?? '—') : null;
  const tickered = useTickerNumber(target);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-2xl border border-[color:var(--color-divider)] bg-[color:var(--color-canvas)] px-8 py-12 md:px-12 md:py-16"
    >
      {/* Diffuse cyan glow behind the number — restrained, not neon */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[60%] w-[40%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: 'rgba(77,255,255,0.10)' }}
      />
      <p className="eyebrow relative">{label}</p>
      <motion.p
        initial={{ scale: 0.92, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative mt-6 font-display italic tabular-nums"
        style={{
          fontSize: 'clamp(72px,11vw,168px)',
          lineHeight: 0.9,
          letterSpacing: '-0.04em',
          color: 'var(--color-accent)',
          textShadow: '0 0 32px rgba(77,255,255,0.18)',
        }}
      >
        {target !== null ? formatNumber(tickered) : displayString}
      </motion.p>
    </motion.div>
  );
}

// Briefly tick the number from 0 → target so the hero stat lands with a
// real "I just computed this" beat. ~600ms total, deceleration eased.
function useTickerNumber(target: number | null): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === null) return;
    const start = performance.now();
    const duration = 700;
    let frame: number;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutExpo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setValue(target * eased);
      if (t < 1) frame = requestAnimationFrame(step);
      else setValue(target);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return value;
}

function formatVal(v: unknown): string {
  if (typeof v === 'number') return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return String(v ?? '—');
}

function formatNumber(n: number): string {
  // Smart formatting based on magnitude. Sub-1 numbers (shares,
  // probabilities) get more precision; whole numbers stay clean.
  if (Math.abs(n) < 1 && n !== 0) {
    return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }
  if (n >= 1000) {
    return Math.round(n).toLocaleString();
  }
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
