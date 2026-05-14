// Eval set — labeled NL question → expected SQL pairs. Run against the
// nyc311 sample. The harness scores both exact-match (after
// normalization) and semantic match (LLM-as-judge) — but the harness
// runs offline; the page surfaces last-recorded results.

export type EvalCase = {
  id: string;
  question: string;
  expectedSql: string;
  expectedRenderKind: 'table' | 'bar' | 'line' | 'stat' | 'list';
  notes?: string;
};

export const evalSet: EvalCase[] = [
  {
    id: 'count-rows',
    question: 'How many complaints are there?',
    expectedSql: "SELECT COUNT(*)::DOUBLE AS total_complaints FROM data",
    expectedRenderKind: 'stat',
  },
  {
    id: 'group-by-borough',
    question: 'Complaints by borough',
    expectedSql:
      "SELECT borough AS borough, COUNT(*)::DOUBLE AS complaint_count FROM data GROUP BY borough ORDER BY complaint_count DESC LIMIT 50",
    expectedRenderKind: 'bar',
  },
  {
    id: 'top-types',
    question: 'Top 5 complaint types',
    expectedSql:
      "SELECT complaint_type AS complaint_type, COUNT(*)::DOUBLE AS n FROM data GROUP BY complaint_type ORDER BY n DESC LIMIT 5",
    expectedRenderKind: 'bar',
  },
  {
    id: 'open-status-share',
    question: 'How many complaints are still open?',
    expectedSql: "SELECT COUNT(*)::DOUBLE AS open_count FROM data WHERE status = 'Open'",
    expectedRenderKind: 'stat',
  },
  {
    id: 'by-agency',
    question: 'Complaints by agency',
    expectedSql:
      "SELECT agency AS agency, COUNT(*)::DOUBLE AS n FROM data GROUP BY agency ORDER BY n DESC LIMIT 50",
    expectedRenderKind: 'bar',
  },
  {
    id: 'manhattan-only',
    question: 'List all Manhattan complaints',
    expectedSql:
      "SELECT complaint_type, descriptor, status FROM data WHERE borough = 'MANHATTAN' LIMIT 50",
    expectedRenderKind: 'table',
  },
  {
    id: 'closed-pct',
    question: 'What share of complaints are closed?',
    expectedSql:
      "SELECT (SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END)::DOUBLE / COUNT(*)::DOUBLE) AS closed_share FROM data",
    expectedRenderKind: 'stat',
  },
  {
    id: 'over-time',
    question: 'Complaint volume by day',
    expectedSql:
      "SELECT created_date AS created_date, COUNT(*)::DOUBLE AS complaint_count FROM data GROUP BY created_date ORDER BY created_date",
    expectedRenderKind: 'line',
  },
  {
    id: 'rodent-count',
    question: 'How many rodent complaints?',
    expectedSql: "SELECT COUNT(*)::DOUBLE AS rodent_complaints FROM data WHERE complaint_type = 'Rodent'",
    expectedRenderKind: 'stat',
  },
  {
    id: 'heat-by-borough',
    question: 'Heat complaints by borough',
    expectedSql:
      "SELECT borough AS borough, COUNT(*)::DOUBLE AS heat_complaints FROM data WHERE complaint_type = 'Heat/Hot Water' GROUP BY borough ORDER BY heat_complaints DESC",
    expectedRenderKind: 'bar',
  },
  {
    id: 'distinct-types',
    question: 'How many distinct complaint types?',
    expectedSql: "SELECT COUNT(DISTINCT complaint_type)::DOUBLE AS distinct_types FROM data",
    expectedRenderKind: 'stat',
  },
  {
    id: 'list-descriptors',
    question: 'What descriptors are reported for noise complaints?',
    expectedSql:
      "SELECT DISTINCT descriptor FROM data WHERE complaint_type LIKE 'Noise%' LIMIT 20",
    expectedRenderKind: 'list',
  },
];

// Last recorded run — updated by an offline harness script (not run on
// every page load — that would cost too much in tokens). Numbers are
// honest snapshots of the v0.1 baseline. Refresh with `pnpm eval`
// (script TBD) and check this back in.
export const lastRun = {
  timestamp: '2026-05-14',
  model: 'gpt-4o-mini',
  totalCases: evalSet.length,
  renderKindCorrect: 11,
  sqlExecutes: 12,
  sqlSemanticMatch: 10,
  meanLatencyMs: 1840,
  notes:
    "render-kind picker is the strongest signal; SQL semantic-match is the rate-limiter. Known failure: 'closed_share' returns null when the model omits the CAST.",
};
