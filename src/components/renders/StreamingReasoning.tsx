'use client';

import { useMemo } from 'react';
import { StreamingReveal } from 'streamfield';

type Props = { text: string };

type Stream = {
  /** Each non-whitespace word arrives as its own field so streamfield's
   * per-field state map drives a word-by-word cascade. We synthesize
   * the stream from the current text snapshot — this is exactly the
   * pattern any consumer would use for sub-field streaming. */
  [key: `w${number}`]: string;
};

export function StreamingReasoning({ text }: Props) {
  const stream = useMemo<Partial<Stream>>(() => {
    const tokens = text.split(/(\s+)/);
    const out: Partial<Stream> = {};
    tokens.forEach((t, i) => {
      out[`w${i}` as keyof Stream] = t;
    });
    return out;
  }, [text]);

  const keys = Object.keys(stream) as Array<keyof Stream>;

  return (
    <p className="type-h2 max-w-[60ch] text-[clamp(22px,2.4vw,30px)] leading-[1.25] text-[color:var(--color-ink)]">
      <StreamingReveal<Stream> stream={stream} variant="cascade">
        {(fields) => (
          <>
            {keys.map((k) => (
              <span key={k} data-streamfield-state={fields[k]?.state}>
                {fields[k]?.value}
              </span>
            ))}
          </>
        )}
      </StreamingReveal>
    </p>
  );
}
