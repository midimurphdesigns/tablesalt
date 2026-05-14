'use client';

import * as duckdb from '@duckdb/duckdb-wasm';
import type { QueryResult } from './types';

let dbPromise: Promise<duckdb.AsyncDuckDB> | null = null;

async function getDb(): Promise<duckdb.AsyncDuckDB> {
  if (dbPromise) return dbPromise;
  dbPromise = (async () => {
    const bundles = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(bundles);
    const workerUrl = URL.createObjectURL(
      new Blob([`importScripts("${bundle.mainWorker!}");`], {
        type: 'text/javascript',
      }),
    );
    const worker = new Worker(workerUrl);
    const logger = new duckdb.ConsoleLogger();
    const db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    URL.revokeObjectURL(workerUrl);
    return db;
  })();
  return dbPromise;
}

export async function loadCsv(file: File | string, tableName = 'data'): Promise<void> {
  const db = await getDb();
  const conn = await db.connect();
  try {
    if (typeof file === 'string') {
      await db.registerFileText(`${tableName}.csv`, file);
    } else {
      const buf = new Uint8Array(await file.arrayBuffer());
      await db.registerFileBuffer(`${tableName}.csv`, buf);
    }
    await conn.query(`DROP TABLE IF EXISTS ${tableName}`);
    await conn.query(
      `CREATE TABLE ${tableName} AS SELECT * FROM read_csv_auto('${tableName}.csv', header=true, sample_size=-1)`,
    );
  } finally {
    await conn.close();
  }
}

// Coerce a DuckDB scalar into a display-friendly primitive. Critically,
// DATE / TIMESTAMP / TIME columns come back as BigInt epoch micros (or
// JS Date objects depending on type) — naive Number() conversion lands
// you with raw 1.7e12 numbers in the UI. We detect date-flavored Arrow
// types from the schema field and emit ISO date strings instead.
function coerce(v: unknown, isDate: boolean): string | number | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (isDate) {
    let ms: number;
    if (typeof v === 'bigint') {
      // DuckDB DATE arrives as days-since-epoch in some bundles, ms in
      // others. Heuristic: anything under ~1970+200yrs in days (~73000)
      // is days-since-epoch; otherwise treat as ms.
      const n = Number(v);
      ms = Math.abs(n) < 100_000 ? n * 86_400_000 : n;
    } else if (typeof v === 'number') {
      ms = Math.abs(v) < 100_000 ? v * 86_400_000 : v;
    } else {
      return String(v);
    }
    if (!Number.isFinite(ms)) return String(v);
    return new Date(ms).toISOString().slice(0, 10);
  }
  if (typeof v === 'bigint') return Number(v);
  if (typeof v === 'number' || typeof v === 'string') return v;
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return String(v);
}

function isDateField(typeName: string | undefined): boolean {
  if (!typeName) return false;
  const t = typeName.toLowerCase();
  return t.includes('date') || t.includes('time');
}

export async function runQuery(sql: string): Promise<QueryResult> {
  const db = await getDb();
  const conn = await db.connect();
  try {
    const result = await conn.query(sql);
    const columns = result.schema.fields.map((f) => f.name);
    const dateMap = new Map<string, boolean>();
    for (const f of result.schema.fields) {
      // f.type.toString() returns e.g. 'Date32<DAY>', 'Timestamp<MICROSECOND>'
      const typeName = f.type?.toString?.() ?? '';
      dateMap.set(f.name, isDateField(typeName));
    }
    const rows = result.toArray().map((row) => {
      const out: Record<string, string | number | null> = {};
      for (const col of columns) {
        out[col] = coerce(row[col], dateMap.get(col) ?? false);
      }
      return out;
    });
    return { columns, rows };
  } finally {
    await conn.close();
  }
}

export async function describeTable(tableName = 'data') {
  const db = await getDb();
  const conn = await db.connect();
  try {
    const colsResult = await conn.query(`DESCRIBE ${tableName}`);
    const cols = colsResult.toArray() as Array<{ column_name: string; column_type: string; null: string }>;
    const countResult = await conn.query(`SELECT COUNT(*)::INTEGER AS n FROM ${tableName}`);
    const rowCount = Number((countResult.toArray()[0] as { n: number }).n);
    return { cols, rowCount };
  } finally {
    await conn.close();
  }
}
