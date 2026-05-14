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
