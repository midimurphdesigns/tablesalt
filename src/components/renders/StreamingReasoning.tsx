'use client';

import { Typewriter } from 'streamfield';

type Props = { text: string };

/**
 * Streaming reasoning summary — a single string field from the agent
 * response, revealed character by character via streamfield's
 * <Typewriter>. The animation moved to streamfield 0.2 so consumers of
 * the package get the same primitive without rewriting it.
 */
export function StreamingReasoning({ text }: Props) {
  return (
    <p className="type-h2 max-w-[60ch] text-[clamp(22px,2.4vw,30px)] leading-[1.25] text-[color:var(--color-ink)]">
      <Typewriter text={text} speed={18} />
    </p>
  );
}
