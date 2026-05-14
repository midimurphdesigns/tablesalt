// Per-million-token pricing for the models tablesalt routes through.
// Last refreshed 2026-05-14. AI Gateway exposes these via the usage
// response too, but having a local map lets us surface cost in the UI
// without an extra round-trip.

type Price = { inputPerM: number; outputPerM: number };

const PRICES: Record<string, Price> = {
  'openai/gpt-4o-mini': { inputPerM: 0.15, outputPerM: 0.6 },
  'openai/gpt-4o': { inputPerM: 2.5, outputPerM: 10.0 },
  'openai/gpt-4.1-mini': { inputPerM: 0.4, outputPerM: 1.6 },
  'anthropic/claude-haiku-4-5': { inputPerM: 1.0, outputPerM: 5.0 },
  'anthropic/claude-sonnet-4-5': { inputPerM: 3.0, outputPerM: 15.0 },
};

export function estimateCost(
  modelId: string,
  inputTokens: number | undefined,
  outputTokens: number | undefined,
): number | null {
  const price = PRICES[modelId];
  if (!price) return null;
  if (inputTokens === undefined || outputTokens === undefined) return null;
  return (inputTokens / 1_000_000) * price.inputPerM + (outputTokens / 1_000_000) * price.outputPerM;
}

export function formatUsd(amount: number): string {
  if (amount < 0.001) return `<$0.001`;
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  if (amount < 1) return `$${amount.toFixed(3)}`;
  return `$${amount.toFixed(2)}`;
}
