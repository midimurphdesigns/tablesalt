'use client';

import { useState, useRef, useEffect } from 'react';

type Props = {
  onAsk: (q: string) => void;
  disabled?: boolean;
  prefill?: string;
};

export function QuestionInput({ onAsk, disabled, prefill }: Props) {
  const [value, setValue] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (prefill !== undefined && prefill !== value) {
      setValue(prefill);
      ref.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onAsk(value.trim());
      }}
      className="surface flex items-end gap-3 p-3"
    >
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ask anything about this data…"
        rows={1}
        className="min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-[16px] text-[color:var(--color-ink)] placeholder:text-[color:var(--color-ink-faint)] focus:outline-none"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) onAsk(value.trim());
          }
        }}
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="self-stretch rounded-lg border border-[color:var(--color-accent)]/40 bg-[color:var(--color-accent)]/10 px-4 py-2 type-mono text-[color:var(--color-accent)] transition-all hover:bg-[color:var(--color-accent)]/20 disabled:cursor-not-allowed disabled:opacity-30"
      >
        ask
      </button>
    </form>
  );
}
