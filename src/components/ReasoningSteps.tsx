'use client';

import { motion } from 'framer-motion';
import { Typewriter, usePacedList } from 'streamfield';
import type { AgentStep, AgentStepTool } from '@/lib/types';

type Props = {
  steps: AgentStep[];
  /** When true, render fully and skip paced reveal — used inside the
   * collapsible 'how the agent got there' section after the answer is
   * already shown so a second view doesn't re-animate. */
  immediate?: boolean;
};

const STEP_ORDER: AgentStepTool[] = [
  'profile_schema',
  'pick_render_kind',
  'draft_sql',
  'validate_sql',
];

const STEP_LABELS: Record<AgentStepTool, string> = {
  profile_schema: 'profile_schema',
  pick_render_kind: 'pick_render_kind',
  draft_sql: 'draft_sql',
  validate_sql: 'validate_sql',
};

// 480ms cadence: a hiring manager has a beat to read each step before
// the next lands. Tuned by feel; total reveal time ~2.4s.
const STEP_REVEAL_MS = 480;
const TYPE_SPEED_MS = 22;

export function ReasoningSteps({ steps, immediate }: Props) {
  // streamfield's usePacedList holds back the visible list so reveals
  // happen at minimum STEP_REVEAL_MS apart — even when the AI SDK
  // hands us all 4 steps in one network frame.
  const paced = usePacedList(steps, STEP_REVEAL_MS);
  const revealedCount = immediate ? STEP_ORDER.length : paced.length;

  return (
    <ol className="relative space-y-3 border-l border-[color:var(--color-divider)] pl-5">
      {STEP_ORDER.map((tool, i) => {
        const step = steps[i];
        const isRevealed = i < revealedCount && Boolean(step?.note);
        const isActive = i === revealedCount && !immediate;

        return (
          <motion.li
            key={tool}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: isRevealed ? 1 : isActive ? 0.55 : 0.18, x: 0 }}
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative"
          >
            <span
              aria-hidden
              className="absolute -left-[26px] top-[4px] flex h-3 w-3 items-center justify-center"
            >
              <motion.span
                animate={{
                  scale: isActive ? [1, 1.4, 1] : 1,
                  opacity: isRevealed ? 1 : isActive ? 0.85 : 0.3,
                }}
                transition={
                  isActive
                    ? { duration: 1.1, repeat: Infinity, ease: 'easeInOut' }
                    : { duration: 0.3 }
                }
                className={`block h-1.5 w-1.5 rounded-full ${
                  isRevealed || isActive
                    ? 'bg-[color:var(--color-accent)]'
                    : 'bg-[color:var(--color-divider)]'
                }`}
                style={
                  isRevealed || isActive
                    ? { boxShadow: '0 0 8px rgba(77,255,255,0.5)' }
                    : undefined
                }
              />
            </span>

            <p className="type-mono-tiny text-[color:var(--color-ink-faint)]">
              {STEP_LABELS[tool]}
              {isActive && (
                <span className="ml-2 text-[color:var(--color-accent)]">thinking…</span>
              )}
            </p>
            <p className="mt-1 type-mono text-[color:var(--color-ink)]">
              {isRevealed && step?.note ? (
                immediate ? (
                  step.note
                ) : (
                  <Typewriter text={step.note} speed={TYPE_SPEED_MS} />
                )
              ) : (
                <span className="text-[color:var(--color-ink-faint)]">·</span>
              )}
            </p>
          </motion.li>
        );
      })}
    </ol>
  );
}
