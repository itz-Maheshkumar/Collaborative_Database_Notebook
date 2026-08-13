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

export interface QueryHistoryItem {
  id: number;
  user_id: number;
  notebook_id?: number;
  cell_id?: number;
  connection_id?: number;
  engine: string;
  query_text: string;
  status: 'success' | 'error';
  row_count: number;
  execution_time_ms: number;
  error_message?: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ApiError {
  detail: string | { msg: string }[];
}

export interface TutorialSection {
  id: string;
  title: string;
}

export interface TutorialMeta {
  id: string;
  title: string;
  description: string;
  engine: string;
  difficulty: string;
  estimatedMinutes: number;
  sections: TutorialSection[];
}

export interface TutorialProgressItem {
  tutorial_id: string;
  section_id: string;
  completed_at: string;
}

export interface AdminUser {
  id: number;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  notebook_count: number;
  connection_count: number;
  query_count: number;
}

export interface AnalyticsData {
  total_users: number;
  active_users: number;
  total_notebooks: number;
  total_connections: number;
  total_queries_executed: number;
  successful_queries: number;
  failed_queries: number;
  avg_query_time_ms: number;
  new_users_last_7d: number;
  queries_last_7d: number;
}

export interface AuditLogEntry {
  id: number;
  user_id: number;
  user_email: string;
  engine: string;
  query_text: string;
  status: string;
  row_count: number;
  execution_time_ms: number;
  error_message?: string;
  created_at: string;
}

export interface AuditLogListResponse {
  items: AuditLogEntry[];
  total: number;
}
