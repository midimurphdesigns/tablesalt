'use client';

import { describeTable, runQuery } from './duckdb';
import type { ColumnProfile, ColumnType, DatasetProfile } from './types';

function mapDuckType(t: string): ColumnType {
  const upper = t.toUpperCase();
  if (upper.includes('INT') || upper.includes('DOUBLE') || upper.includes('FLOAT') || upper.includes('DECIMAL') || upper.includes('NUMERIC')) {
    return 'number';
  }
  if (upper.includes('DATE') || upper.includes('TIME')) return 'date';
  if (upper.includes('BOOL')) return 'boolean';
  return 'string';
}

export async function profileTable(tableName = 'data'): Promise<DatasetProfile> {
  const { cols, rowCount } = await describeTable(tableName);
  const columns: ColumnProfile[] = [];
  for (const col of cols) {
    const type = mapDuckType(col.column_type);
    const safeName = `"${col.column_name.replace(/"/g, '""')}"`;
    const cardinalityResult = await runQuery(
      `SELECT COUNT(DISTINCT ${safeName})::INTEGER AS n FROM ${tableName}`,
    );
    const cardinality = Number(cardinalityResult.rows[0]?.n ?? 0);
    const sampleResult = await runQuery(
      `SELECT DISTINCT ${safeName} AS v FROM ${tableName} WHERE ${safeName} IS NOT NULL LIMIT 5`,
    );
    const sample = sampleResult.rows.map((r) => String(r.v));

    const profile: ColumnProfile = {
      name: col.column_name,
      type,
      nullable: col.null !== 'NO',
      cardinality,
      sample,
    };

    if (type === 'number' || type === 'date') {
      try {
        const range = await runQuery(
          `SELECT MIN(${safeName}) AS min_v, MAX(${safeName}) AS max_v FROM ${tableName}`,
        );
        profile.min = range.rows[0]?.min_v as number | string;
        profile.max = range.rows[0]?.max_v as number | string;
      } catch {
        // skip — non-aggregatable column
      }
    }

    // Top-values for categoricals — drives the top-3 bar in the profile UI.
    if (type === 'string' && cardinality > 1 && cardinality < 50) {
      try {
        const topRes = await runQuery(
          `SELECT ${safeName} AS v, COUNT(*)::INTEGER AS n FROM ${tableName} WHERE ${safeName} IS NOT NULL GROUP BY ${safeName} ORDER BY n DESC LIMIT 4`,
        );
        profile.topValues = topRes.rows.map((r) => ({
          value: String(r.v),
          count: Number(r.n),
        }));
      } catch {
        // skip
      }
    }

    // Histogram for numerics — 10 equal-width buckets.
    if (type === 'number' && typeof profile.min === 'number' && typeof profile.max === 'number' && profile.max > profile.min) {
      try {
        const histRes = await runQuery(
          `WITH bounds AS (
             SELECT MIN(${safeName})::DOUBLE AS lo, MAX(${safeName})::DOUBLE AS hi FROM ${tableName}
           )
           SELECT
             LEAST(9, FLOOR((${safeName}::DOUBLE - bounds.lo) / NULLIF((bounds.hi - bounds.lo) / 10.0, 0)))::INTEGER AS bucket,
             COUNT(*)::INTEGER AS n
           FROM ${tableName}, bounds
           WHERE ${safeName} IS NOT NULL
           GROUP BY bucket
           ORDER BY bucket`,
        );
        profile.histogram = histRes.rows.map((r) => ({
          bucket: Number(r.bucket),
          count: Number(r.n),
        }));
      } catch {
        // skip
      }
    }

    columns.push(profile);
  }

  return {
    rowCount,
    columns,
    suggestedQuestions: suggestQuestions(columns, rowCount),
  };
}

function suggestQuestions(columns: ColumnProfile[], rowCount: number): string[] {
  const out: string[] = [];
  const numeric = columns.filter((c) => c.type === 'number');
  const categorical = columns.filter(
    (c) => c.type === 'string' && c.cardinality > 1 && c.cardinality < Math.min(50, rowCount),
  );
  const dates = columns.filter((c) => c.type === 'date');

  if (numeric.length > 0 && categorical.length > 0) {
    out.push(`Average ${numeric[0].name} by ${categorical[0].name}`);
    out.push(`Top 10 ${categorical[0].name} by total ${numeric[0].name}`);
  }
  if (categorical.length > 0) {
    out.push(`Distribution of ${categorical[0].name}`);
  }
  if (dates.length > 0 && numeric.length > 0) {
    out.push(`${numeric[0].name} over time`);
  }
  if (out.length === 0) {
    out.push('Show the first 20 rows');
    out.push('Count rows grouped by the first text column');
  }
  return out.slice(0, 4);
}
