import { getToken } from './auth';
import { TokenResponse, User } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'An unexpected error occurred';
    try {
      const errorData = await response.json();
      if (typeof errorData.detail === 'string') {
        errorDetail = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        errorDetail = errorData.detail.map((e: { msg: string }) => e.msg).join(', ');
      }
    } catch {
      errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return response.json() as Promise<T>;
}

export async function loginApi(email: string, password: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function registerApi(
  username: string,
  email: string,
  password: string
): Promise<User> {
  return apiFetch<User>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
}

export async function getCurrentUserApi(): Promise<User> {
  return apiFetch<User>('/api/v1/auth/me');
}

// ─── Connection APIs ──────────────────────────────────────────────

export async function getConnectionsApi(): Promise<Connection[]> {
  return apiFetch<Connection[]>('/api/v1/connections');
}

export async function createConnectionApi(data: ConnectionCreate): Promise<Connection> {
  return apiFetch<Connection>('/api/v1/connections', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateConnectionApi(id: number, data: Partial<ConnectionCreate>): Promise<Connection> {
  return apiFetch<Connection>(`/api/v1/connections/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteConnectionApi(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/connections/${id}`, {
    method: 'DELETE',
  });
}

export async function testConnectionApi(data: Partial<ConnectionCreate>): Promise<ConnectionTestResult> {
  return apiFetch<ConnectionTestResult>('/api/v1/connections/test', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Notebook APIs ────────────────────────────────────────────────

export async function getNotebooksApi(): Promise<Notebook[]> {
  return apiFetch<Notebook[]>('/api/v1/notebooks');
}

export async function getNotebookApi(id: number): Promise<Notebook> {
  return apiFetch<Notebook>(`/api/v1/notebooks/${id}`);
}

export async function createNotebookApi(data: NotebookCreate): Promise<Notebook> {
  return apiFetch<Notebook>('/api/v1/notebooks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateNotebookApi(id: number, data: Partial<NotebookCreate>): Promise<Notebook> {
  return apiFetch<Notebook>(`/api/v1/notebooks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteNotebookApi(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/notebooks/${id}`, {
    method: 'DELETE',
  });
}

export async function addCellApi(
  notebookId: number,
  data: { position: number; cell_type: string; content: string }
): Promise<NotebookCell> {
  return apiFetch<NotebookCell>(`/api/v1/notebooks/${notebookId}/cells`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCellApi(
  notebookId: number,
  cellId: number,
  data: Partial<NotebookCell>
): Promise<NotebookCell> {
  return apiFetch<NotebookCell>(`/api/v1/notebooks/${notebookId}/cells/${cellId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCellApi(notebookId: number, cellId: number): Promise<void> {
  return apiFetch<void>(`/api/v1/notebooks/${notebookId}/cells/${cellId}`, {
    method: 'DELETE',
  });
}

// ─── Query APIs ───────────────────────────────────────────────────

export async function executeQueryApi(
  cellId: number,
  connectionId: number,
  queryText: string
): Promise<QueryResult> {
  return apiFetch<QueryResult>('/api/v1/query/execute', {
    method: 'POST',
    body: JSON.stringify({
      cell_id: cellId,
      connection_id: connectionId,
      query_text: queryText,
    }),
  });
}
