// Read-only guard. The agent system prompt forbids non-SELECT, but
// LLMs drift — enforce the contract on the client too.
const BANNED = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|ATTACH|COPY|PRAGMA|EXEC|CALL|BEGIN|COMMIT|ROLLBACK)\b/i;

export function assertReadOnlySql(sql: string): string {
  const trimmed = sql.trim().replace(/;+\s*$/, '');
  if (!trimmed) throw new Error('Empty SQL.');
  if (BANNED.test(trimmed)) {
    throw new Error('Only read-only SELECT statements are allowed.');
  }
  if (!/^\s*(SELECT|WITH)\b/i.test(trimmed)) {
    throw new Error('Query must start with SELECT or WITH.');
  }
  return trimmed;
}
