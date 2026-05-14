'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

type Props = { text: string };

export function StreamingReasoning({ text }: Props) {
  // Split into words, animate cascade. Each word reveals once.
  const words = useMemo(() => text.split(/(\s+)/), [text]);
  return (
    <p className="type-h2 max-w-[60ch] text-[clamp(22px,2.4vw,30px)] leading-[1.25] text-[color:var(--color-ink)]">
      {words.map((w, i) => (
        <motion.span
          key={`${i}-${w}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: Math.min(i * 0.012, 1.2) }}
          className="inline"
        >
          {w}
        </motion.span>
      ))}
    </p>
  );
}
