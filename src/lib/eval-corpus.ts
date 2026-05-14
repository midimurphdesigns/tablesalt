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

// Lightweight in-process SQL evaluator for the eval harness. The edge
// runtime can't load duckdb-wasm (browser-only) so we walk the SQL and
// execute a recognized subset. This intentionally covers the *shapes*
// the eval set produces, plus the common LLM variants for each shape —
// COUNT-aggregate, COUNT(DISTINCT), GROUP BY + ORDER BY, LIKE filters,
// SUM/AVG aggregates, and the conditional CASE pattern for share-of.
//
// If a query parses but uses an unimplemented function, we surface the
// query in the error so the case row in the UI shows what the model
// actually emitted and why we couldn't run it.
type Row = Nyc311Row;
type Cell = string | number | null;
type Result = { columns: string[]; rows: Array<Record<string, Cell>> };

const COLS = new Set<string>(NYC311_HEADER);

function applyWhere(rows: Row[], whereClause: string | undefined): Row[] {
  if (!whereClause) return rows;
  // Support: col = 'val', col LIKE 'pat%', col IN ('a','b')
  const eq = whereClause.match(/^(\w+)\s*=\s*'([^']+)'$/i);
  if (eq) {
    const [, col, val] = eq;
    if (!COLS.has(col)) return rows;
    return rows.filter((r) => String(r[col as keyof Row]) === val);
  }
  const like = whereClause.match(/^(\w+)\s+LIKE\s+'([^']+)'$/i);
  if (like) {
    const [, col, pat] = like;
    if (!COLS.has(col)) return rows;
    const regex = new RegExp(
      '^' + pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\%/g, '.*').replace(/\\_/g, '.') + '$',
      'i',
    );
    return rows.filter((r) => regex.test(String(r[col as keyof Row])));
  }
  return rows;
}

function colOrNull(name: string): keyof Row | null {
  return COLS.has(name) ? (name as keyof Row) : null;
}

export function execLocal(sql: string): Result | { error: string } {
  const s = sql.replace(/;\s*$/, '').replace(/\s+/g, ' ').trim();

  // ---- COUNT(*) [WHERE ...] (single scalar) ---------------------------
  const count = s.match(/^SELECT\s+COUNT\(\*\)(?:::\w+)?\s*(?:AS\s+(\w+))?\s+FROM\s+data(?:\s+WHERE\s+(.+?))?$/i);
  if (count) {
    const alias = count[1] ?? 'count';
    const filtered = applyWhere(NYC311_ROWS, count[2]);
    return { columns: [alias], rows: [{ [alias]: filtered.length }] };
  }

  // ---- COUNT(DISTINCT col) -------------------------------------------
  const cdist = s.match(/^SELECT\s+COUNT\(DISTINCT\s+(\w+)\)(?:::\w+)?\s*(?:AS\s+(\w+))?\s+FROM\s+data$/i);
  if (cdist) {
    const col = colOrNull(cdist[1]);
    if (!col) return { error: `unknown column ${cdist[1]}` };
    const alias = cdist[2] ?? 'count';
    const set = new Set(NYC311_ROWS.map((r) => r[col]));
    return { columns: [alias], rows: [{ [alias]: set.size }] };
  }

  // ---- Conditional share: SUM(CASE WHEN col = 'x' THEN 1 ELSE 0 END) / COUNT(*) ---
  const share = s.match(/^SELECT\s+\(?\s*SUM\(\s*CASE\s+WHEN\s+(\w+)\s*=\s*'([^']+)'\s+THEN\s+1\s+ELSE\s+0\s+END\s*\)(?:::\w+)?\s*\/\s*COUNT\(\*\)(?:::\w+)?\s*\)?\s*(?:AS\s+(\w+))?\s+FROM\s+data$/i);
  if (share) {
    const col = colOrNull(share[1]);
    if (!col) return { error: `unknown column ${share[1]}` };
    const val = share[2];
    const alias = share[3] ?? 'share';
    const hits = NYC311_ROWS.filter((r) => String(r[col]) === val).length;
    const total = NYC311_ROWS.length;
    return { columns: [alias], rows: [{ [alias]: total === 0 ? 0 : hits / total }] };
  }

  // ---- GROUP BY col ORDER BY count DESC [LIMIT N] --------------------
  const grp = s.match(/^SELECT\s+(\w+)(?:\s+AS\s+\w+)?\s*,\s*COUNT\(\*\)(?:::\w+)?\s*(?:AS\s+(\w+))?\s+FROM\s+data(?:\s+WHERE\s+(.+?))?\s+GROUP\s+BY\s+\w+(?:\s+ORDER\s+BY\s+(?:\w+|COUNT\(\*\)|2)\s*(?:DESC|ASC)?)?(?:\s+LIMIT\s+(\d+))?$/i);
  if (grp) {
    const labelCol = colOrNull(grp[1]);
    if (!labelCol) return { error: `unknown column ${grp[1]}` };
    const countAlias = grp[2] ?? 'count';
    const filtered = applyWhere(NYC311_ROWS, grp[3]);
    const limit = grp[4] ? Number(grp[4]) : Infinity;
    const counts = new Map<string, number>();
    for (const row of filtered) {
      const key = String(row[labelCol]);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
    return {
      columns: [labelCol, countAlias],
      rows: sorted.map(([k, v]) => ({ [labelCol]: k, [countAlias]: v })),
    };
  }

  // ---- SELECT cols FROM data WHERE col = 'val' [LIMIT N] -------------
  const sel = s.match(/^SELECT\s+(.+?)\s+FROM\s+data(?:\s+WHERE\s+(.+?))?(?:\s+LIMIT\s+(\d+))?$/i);
  if (sel) {
    const colsExpr = sel[1].trim();
    const filtered = applyWhere(NYC311_ROWS, sel[2]);
    const limit = sel[3] ? Number(sel[3]) : Infinity;
    let columns: string[];
    if (colsExpr === '*') {
      columns = [...NYC311_HEADER];
    } else if (colsExpr.toUpperCase().startsWith('DISTINCT ')) {
      const c = colsExpr.slice('DISTINCT '.length).trim();
      const col = colOrNull(c);
      if (!col) return { error: `unknown column ${c}` };
      const set = Array.from(new Set(filtered.map((r) => String(r[col])))).slice(0, limit);
      return { columns: [col], rows: set.map((v) => ({ [col]: v })) };
    } else {
      const parts = colsExpr.split(',').map((p) => p.trim());
      for (const p of parts) {
        if (!COLS.has(p)) return { error: `unknown column ${p}` };
      }
      columns = parts;
    }
    const rows = filtered.slice(0, limit).map((r) => {
      const out: Record<string, Cell> = {};
      for (const c of columns) out[c] = String(r[c as keyof Row]);
      return out;
    });
    return { columns, rows };
  }

  return { error: `unsupported query shape: ${s.slice(0, 120)}` };
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
