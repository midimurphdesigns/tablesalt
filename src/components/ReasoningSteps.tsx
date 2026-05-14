'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { AgentStep, AgentStepTool } from '@/lib/types';

type Props = {
  steps: AgentStep[];
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

export function ReasoningSteps({ steps }: Props) {
  return (
    <ol className="relative space-y-2.5 border-l border-[color:var(--color-divider)] pl-5">
      <AnimatePresence>
        {STEP_ORDER.map((tool, i) => {
          const step = steps[i];
          const arrived = Boolean(step?.note);
          return (
            <motion.li
              key={tool}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: arrived ? 1 : 0.25, x: 0 }}
              transition={{ duration: 0.25 }}
              className="relative"
            >
              {/* Tick mark on the left rail */}
              <span
                aria-hidden
                className="absolute -left-[26px] top-[6px] flex h-3 w-3 items-center justify-center"
              >
                <span
                  className={`block h-1.5 w-1.5 rounded-full ${
                    arrived ? 'bg-[color:var(--color-accent)]' : 'bg-[color:var(--color-divider)]'
                  }`}
                  style={
                    arrived
                      ? { boxShadow: '0 0 8px rgba(77,255,255,0.5)' }
                      : undefined
                  }
                />
              </span>

              <p className="type-mono-tiny text-[color:var(--color-ink-faint)]">
                {STEP_LABELS[tool]}
              </p>
              <p className="mt-1 type-mono text-[color:var(--color-ink)]">
                {step?.note ?? <span className="text-[color:var(--color-ink-faint)]">…</span>}
              </p>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ol>
  );
}
