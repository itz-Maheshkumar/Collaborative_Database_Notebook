export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'warned' | 'blocked';

export type DatabaseEngine = 'postgresql' | 'mysql' | 'mongodb' | 'sqlite';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface Connection {
  id: number;
  user_id: number;
  name: string;
  engine: DatabaseEngine;
  host?: string;
  port?: number;
  database_name?: string;
  username?: string;
  has_password: boolean;
  extra_params?: string;
  created_at: string;
  updated_at: string;
}

export interface ConnectionCreate {
  name: string;
  engine: DatabaseEngine;
  host?: string;
  port?: number;
  database_name?: string;
  username?: string;
  password?: string;
  extra_params?: string;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latency_ms?: number;
}

export interface NotebookCell {
  id: number;
  notebook_id: number;
  position: number;
  cell_type: 'sql' | 'code' | 'markdown';
  content: string;
  last_output?: string;
  status: 'idle' | 'running' | 'success' | 'error';
  execution_time_ms?: number;
  created_at: string;
  updated_at: string;
}

export interface Notebook {
  id: number;
  user_id: number;
  connection_id?: number;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  cells: NotebookCell[];
}

export interface NotebookCreate {
  title?: string;
  description?: string;
  connection_id?: number;
}

export interface QueryExecuteRequest {
  cell_id: number;
  connection_id: number;
  query_text: string;
}

export interface QueryResult {
  success: boolean;
  columns: string[];
  rows: Record<string, unknown>[];
  row_count: number;
  execution_time_ms: number;
  error_message?: string;
  engine?: string;
}

export interface ColumnInfo {
  name: string;
  data_type: string;
  is_nullable: boolean;
  is_primary_key: boolean;
}

export interface TableInfo {
  name: string;
  type: string;
  columns: ColumnInfo[];
}

export interface SchemaTreeResponse {
  engine: string;
  database_name: string;
  tables: TableInfo[];
  error_message?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ApiError {
  detail: string | { msg: string }[];
}
