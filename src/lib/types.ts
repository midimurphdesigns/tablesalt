export type ColumnType = 'string' | 'number' | 'date' | 'boolean';

export type ColumnProfile = {
  name: string;
  type: ColumnType;
  nullable: boolean;
  cardinality: number;
  sample: string[];
  min?: number | string;
  max?: number | string;
};

export type DatasetProfile = {
  rowCount: number;
  columns: ColumnProfile[];
  suggestedQuestions: string[];
};

export type RenderKind = 'table' | 'bar' | 'line' | 'stat' | 'list';

export type AgentResponse = {
  reasoning: string;
  sql: string;
  renderKind: RenderKind;
  renderHint: string;
};

export type QueryResult = {
  columns: string[];
  rows: Array<Record<string, string | number | null>>;
};
