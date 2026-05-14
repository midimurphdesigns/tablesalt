// The NYC 311 sample corpus the eval harness runs against. Inlined so
// the server route can read the rows directly without needing a fetch
// out to /samples/nyc311.csv at runtime.
//
// 40 rows, 7 columns. Same data the page loads when the visitor picks
// the NYC 311 sample.

export const NYC311_HEADER = [
  'complaint_id',
  'created_date',
  'borough',
  'complaint_type',
  'descriptor',
  'status',
  'agency',
] as const;

export type Nyc311Row = {
  complaint_id: string;
  created_date: string;
  borough: string;
  complaint_type: string;
  descriptor: string;
  status: string;
  agency: string;
};

export const NYC311_ROWS: Nyc311Row[] = [
  { complaint_id: 'NYC-001', created_date: '2024-03-01', borough: 'MANHATTAN', complaint_type: 'Noise - Residential', descriptor: 'Loud Music/Party', status: 'Closed', agency: 'NYPD' },
  { complaint_id: 'NYC-002', created_date: '2024-03-01', borough: 'BROOKLYN', complaint_type: 'Heat/Hot Water', descriptor: 'Heat', status: 'In Progress', agency: 'HPD' },
  { complaint_id: 'NYC-003', created_date: '2024-03-01', borough: 'QUEENS', complaint_type: 'Illegal Parking', descriptor: 'Blocked Hydrant', status: 'Closed', agency: 'NYPD' },
  { complaint_id: 'NYC-004', created_date: '2024-03-02', borough: 'BRONX', complaint_type: 'Heat/Hot Water', descriptor: 'Heat', status: 'Closed', agency: 'HPD' },
  { complaint_id: 'NYC-005', created_date: '2024-03-02', borough: 'MANHATTAN', complaint_type: 'Noise - Commercial', descriptor: 'Banging/Pounding', status: 'Closed', agency: 'NYPD' },
  { complaint_id: 'NYC-006', created_date: '2024-03-02', borough: 'BROOKLYN', complaint_type: 'Rodent', descriptor: 'Rat Sighting', status: 'In Progress', agency: 'DOHMH' },
  { complaint_id: 'NYC-007', created_date: '2024-03-02', borough: 'STATEN ISLAND', complaint_type: 'Street Condition', descriptor: 'Pothole', status: 'Open', agency: 'DOT' },
  { complaint_id: 'NYC-008', created_date: '2024-03-03', borough: 'MANHATTAN', complaint_type: 'Heat/Hot Water', descriptor: 'Hot Water', status: 'Closed', agency: 'HPD' },
  { complaint_id: 'NYC-009', created_date: '2024-03-03', borough: 'QUEENS', complaint_type: 'Noise - Residential', descriptor: 'Loud Music/Party', status: 'Closed', agency: 'NYPD' },
  { complaint_id: 'NYC-010', created_date: '2024-03-03', borough: 'BROOKLYN', complaint_type: 'Illegal Parking', descriptor: 'Double Parked', status: 'Closed', agency: 'NYPD' },
  { complaint_id: 'NYC-011', created_date: '2024-03-04', borough: 'BRONX', complaint_type: 'Rodent', descriptor: 'Rat Sighting', status: 'In Progress', agency: 'DOHMH' },
  { complaint_id: 'NYC-012', created_date: '2024-03-04', borough: 'MANHATTAN', complaint_type: 'Street Condition', descriptor: 'Pothole', status: 'Open', agency: 'DOT' },
  { complaint_id: 'NYC-013', created_date: '2024-03-04', borough: 'BROOKLYN', complaint_type: 'Noise - Commercial', descriptor: 'Loud Talking', status: 'Closed', agency: 'NYPD' },
  { complaint_id: 'NYC-014', created_date: '2024-03-05', borough: 'QUEENS', complaint_type: 'Heat/Hot Water', descriptor: 'Heat', status: 'Closed', agency: 'HPD' },
  { complaint_id: 'NYC-015', created_date: '2024-03-05', borough: 'MANHATTAN', complaint_type: 'Noise - Residential', descriptor: 'Loud Music/Party', status: 'Open', agency: 'NYPD' },
  { complaint_id: 'NYC-016', created_date: '2024-03-05', borough: 'BROOKLYN', complaint_type: 'Heat/Hot Water', descriptor: 'Heat', status: 'Closed', agency: 'HPD' },
  { complaint_id: 'NYC-017', created_date: '2024-03-06', borough: 'BRONX', complaint_type: 'Illegal Parking', descriptor: 'Blocked Hydrant', status: 'Closed', agency: 'NYPD' },
  { complaint_id: 'NYC-018', created_date: '2024-03-06', borough: 'STATEN ISLAND', complaint_type: 'Street Condition', descriptor: 'Pothole', status: 'Closed', agency: 'DOT' },
  { complaint_id: 'NYC-019', created_date: '2024-03-06', borough: 'MANHATTAN', complaint_type: 'Rodent', descriptor: 'Rat Sighting', status: 'In Progress', agency: 'DOHMH' },
  { complaint_id: 'NYC-020', created_date: '2024-03-07', borough: 'QUEENS', complaint_type: 'Noise - Residential', descriptor: 'Banging/Pounding', status: 'Closed', agency: 'NYPD' },
  { complaint_id: 'NYC-021', created_date: '2024-03-07', borough: 'BROOKLYN', complaint_type: 'Heat/Hot Water', descriptor: 'Heat', status: 'In Progress', agency: 'HPD' },
  { complaint_id: 'NYC-022', created_date: '2024-03-07', borough: 'BRONX', complaint_type: 'Noise - Commercial', descriptor: 'Loud Music/Party', status: 'Closed', agency: 'NYPD' },
  { complaint_id: 'NYC-023', created_date: '2024-03-08', borough: 'MANHATTAN', complaint_type: 'Heat/Hot Water', descriptor: 'Hot Water', status: 'Closed', agency: 'HPD' },
  { complaint_id: 'NYC-024', created_date: '2024-03-08', borough: 'BROOKLYN', complaint_type: 'Rodent', descriptor: 'Mouse Sighting', status: 'Open', agency: 'DOHMH' },
  { complaint_id: 'NYC-025', created_date: '2024-03-08', borough: 'QUEENS', complaint_type: 'Street Condition', descriptor: 'Pothole', status: 'Closed', agency: 'DOT' },
  { complaint_id: 'NYC-026', created_date: '2024-03-09', borough: 'STATEN ISLAND', complaint_type: 'Noise - Residential', descriptor: 'Loud Music/Party', status: 'Closed', agency: 'NYPD' },
  { complaint_id: 'NYC-027', created_date: '2024-03-09', borough: 'MANHATTAN', complaint_type: 'Illegal Parking', descriptor: 'Double Parked', status: 'Closed', agency: 'NYPD' },
  { complaint_id: 'NYC-028', created_date: '2024-03-09', borough: 'BROOKLYN', complaint_type: 'Heat/Hot Water', descriptor: 'Heat', status: 'Closed', agency: 'HPD' },
  { complaint_id: 'NYC-029', created_date: '2024-03-10', borough: 'BRONX', complaint_type: 'Rodent', descriptor: 'Rat Sighting', status: 'In Progress', agency: 'DOHMH' },
  { complaint_id: 'NYC-030', created_date: '2024-03-10', borough: 'MANHATTAN', complaint_type: 'Noise - Commercial', descriptor: 'Banging/Pounding', status: 'Open', agency: 'NYPD' },
  { complaint_id: 'NYC-031', created_date: '2024-03-10', borough: 'QUEENS', complaint_type: 'Heat/Hot Water', descriptor: 'Heat', status: 'Closed', agency: 'HPD' },
  { complaint_id: 'NYC-032', created_date: '2024-03-11', borough: 'BROOKLYN', complaint_type: 'Noise - Residential', descriptor: 'Loud Talking', status: 'Closed', agency: 'NYPD' },
  { complaint_id: 'NYC-033', created_date: '2024-03-11', borough: 'MANHATTAN', complaint_type: 'Street Condition', descriptor: 'Pothole', status: 'Closed', agency: 'DOT' },
  { complaint_id: 'NYC-034', created_date: '2024-03-12', borough: 'BRONX', complaint_type: 'Heat/Hot Water', descriptor: 'Heat', status: 'Closed', agency: 'HPD' },
  { complaint_id: 'NYC-035', created_date: '2024-03-12', borough: 'QUEENS', complaint_type: 'Illegal Parking', descriptor: 'Blocked Hydrant', status: 'In Progress', agency: 'NYPD' },
  { complaint_id: 'NYC-036', created_date: '2024-03-13', borough: 'MANHATTAN', complaint_type: 'Rodent', descriptor: 'Rat Sighting', status: 'Closed', agency: 'DOHMH' },
  { complaint_id: 'NYC-037', created_date: '2024-03-13', borough: 'BROOKLYN', complaint_type: 'Heat/Hot Water', descriptor: 'Hot Water', status: 'Closed', agency: 'HPD' },
  { complaint_id: 'NYC-038', created_date: '2024-03-14', borough: 'STATEN ISLAND', complaint_type: 'Street Condition', descriptor: 'Pothole', status: 'Open', agency: 'DOT' },
  { complaint_id: 'NYC-039', created_date: '2024-03-14', borough: 'MANHATTAN', complaint_type: 'Noise - Residential', descriptor: 'Loud Music/Party', status: 'Closed', agency: 'NYPD' },
  { complaint_id: 'NYC-040', created_date: '2024-03-15', borough: 'QUEENS', complaint_type: 'Heat/Hot Water', descriptor: 'Heat', status: 'Closed', agency: 'HPD' },
];

// Run a query against the corpus in pure JS (the server can't load
// duckdb-wasm — that's browser-only). Supports a tiny subset of SQL
// the harness's expected queries actually use.
export function execLocal(sql: string): { columns: string[]; rows: Array<Record<string, unknown>> } | { error: string } {
  const s = sql.replace(/;\s*$/, '').trim();

  // Helpers
  const upper = s.toUpperCase();

  // Patterns the eval set's expected queries (and most LLM outputs)
  // boil down to. Order matters — more specific first.

  // SELECT COUNT(*)::DOUBLE AS alias FROM data [WHERE col = 'val']
  const countMatch = s.match(/^SELECT\s+COUNT\(\*\)(?:::DOUBLE)?\s+AS\s+([\w]+)\s+FROM\s+data(?:\s+WHERE\s+(\w+)\s*=\s*'([^']+)')?$/i);
  if (countMatch) {
    const [, alias, col, val] = countMatch;
    let filtered: Nyc311Row[] = NYC311_ROWS;
    if (col && val) filtered = NYC311_ROWS.filter((r) => String(r[col as keyof Nyc311Row]) === val);
    return { columns: [alias], rows: [{ [alias]: filtered.length }] };
  }

  // SELECT COUNT(DISTINCT col)::DOUBLE AS alias FROM data
  const countDistinct = s.match(/^SELECT\s+COUNT\(DISTINCT\s+(\w+)\)(?:::DOUBLE)?\s+AS\s+([\w]+)\s+FROM\s+data$/i);
  if (countDistinct) {
    const [, col, alias] = countDistinct;
    const set = new Set(NYC311_ROWS.map((r) => r[col as keyof Nyc311Row]));
    return { columns: [alias], rows: [{ [alias]: set.size }] };
  }

  // SELECT col AS alias, COUNT(*)::DOUBLE AS valAlias FROM data [WHERE...] GROUP BY col ORDER BY valAlias DESC [LIMIT N]
  const groupBy = s.match(/^SELECT\s+(\w+)(?:\s+AS\s+\w+)?\s*,\s*COUNT\(\*\)(?:::DOUBLE)?\s+AS\s+([\w]+)\s+FROM\s+data(?:\s+WHERE\s+(\w+)\s*=\s*'([^']+)')?\s+GROUP\s+BY\s+(\w+)\s+ORDER\s+BY\s+\w+\s+DESC(?:\s+LIMIT\s+(\d+))?$/i);
  if (groupBy) {
    const [, col, valAlias, whereCol, whereVal, , limit] = groupBy;
    let filtered: Nyc311Row[] = NYC311_ROWS;
    if (whereCol && whereVal) filtered = NYC311_ROWS.filter((r) => String(r[whereCol as keyof Nyc311Row]) === whereVal);
    const counts = new Map<string, number>();
    for (const row of filtered) {
      const key = String(row[col as keyof Nyc311Row]);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const out = (limit ? sorted.slice(0, Number(limit)) : sorted).map(([k, v]) => ({ [col]: k, [valAlias]: v }));
    return { columns: [col, valAlias], rows: out };
  }

  // Anything else — bail. The harness scores "executes" as false.
  return { error: `local-eval shim doesn't implement: ${s.slice(0, 100)}` };
}

export const NYC311_SCHEMA = [
  { name: 'complaint_id', type: 'string' as const, nullable: false, cardinality: 40, sample: ['NYC-001', 'NYC-002', 'NYC-003', 'NYC-004'] },
  { name: 'created_date', type: 'date' as const, nullable: false, cardinality: 15, sample: ['2024-03-01', '2024-03-02', '2024-03-03', '2024-03-04'] },
  { name: 'borough', type: 'string' as const, nullable: false, cardinality: 5, sample: ['MANHATTAN', 'BROOKLYN', 'QUEENS', 'BRONX'] },
  { name: 'complaint_type', type: 'string' as const, nullable: false, cardinality: 6, sample: ['Noise - Residential', 'Heat/Hot Water', 'Illegal Parking', 'Rodent'] },
  { name: 'descriptor', type: 'string' as const, nullable: false, cardinality: 10, sample: ['Loud Music/Party', 'Heat', 'Blocked Hydrant'] },
  { name: 'status', type: 'string' as const, nullable: false, cardinality: 3, sample: ['Closed', 'In Progress', 'Open'] },
  { name: 'agency', type: 'string' as const, nullable: false, cardinality: 4, sample: ['NYPD', 'HPD', 'DOHMH', 'DOT'] },
];
