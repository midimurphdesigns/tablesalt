export type ColumnType = 'string' | 'number' | 'date' | 'boolean';

export type ColumnProfile = {
  name: string;
  type: ColumnType;
  nullable: boolean;
  cardinality: number;
  sample: string[];
  min?: number | string;
  max?: number | string;
  /**
   * For categorical strings: top values by frequency with counts. Up to
   * 4 entries. Drives the top-values bar in the column profile chart.
   */
  topValues?: Array<{ value: string; count: number }>;
  /**
   * For numeric columns: a 10-bucket histogram of values. Each bucket
   * has the lower edge and the count in that bucket. Drives the
   * histogram micro-chart.
   */
  histogram?: Array<{ bucket: number; count: number }>;
};

export type DatasetProfile = {
  rowCount: number;
  columns: ColumnProfile[];
  suggestedQuestions: string[];
};

export type RenderKind = 'table' | 'bar' | 'line' | 'stat' | 'list';

export type AgentStepTool =
  | 'profile_schema'
  | 'pick_render_kind'
  | 'draft_sql'
  | 'validate_sql';

export type AgentStep = {
  tool: AgentStepTool;
  note: string;
};

export type AgentResponse = {
  steps: AgentStep[];
  reasoning: string;
  sql: string;
  renderKind: RenderKind;
  renderHint: string;
};

export type QueryResult = {
  columns: string[];
  rows: Array<Record<string, string | number | null>>;
};
