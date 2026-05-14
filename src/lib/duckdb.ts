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

export async function runQuery(sql: string): Promise<QueryResult> {
  const db = await getDb();
  const conn = await db.connect();
  try {
    const result = await conn.query(sql);
    const columns = result.schema.fields.map((f) => f.name);
    const rows = result.toArray().map((row) => {
      const out: Record<string, string | number | null> = {};
      for (const col of columns) {
        const v = row[col];
        if (v === null || v === undefined) {
          out[col] = null;
        } else if (typeof v === 'bigint') {
          out[col] = Number(v);
        } else if (typeof v === 'number' || typeof v === 'string') {
          out[col] = v;
        } else {
          out[col] = String(v);
        }
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
