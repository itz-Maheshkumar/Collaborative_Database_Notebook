from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

# ── User management ──────────────────────────────────────────────

class AdminUserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str | None = None
    role: str
    is_active: bool
    created_at: datetime
    notebook_count: int = 0
    connection_count: int = 0
    query_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class AdminUserUpdate(BaseModel):
    role: str | None = None
    is_active: bool | None = None
    full_name: str | None = None


# ── Analytics ────────────────────────────────────────────────────

class AnalyticsOverviewResponse(BaseModel):
    total_users: int
    active_users: int
    total_notebooks: int
    total_connections: int
    total_queries_executed: int
    successful_queries: int
    failed_queries: int
    avg_query_time_ms: float
    new_users_last_7d: int
    queries_last_7d: int


# ── Audit log ────────────────────────────────────────────────────

class AuditLogEntry(BaseModel):
    id: int
    user_id: int
    user_email: str
    engine: str
    query_text: str
    status: str
    row_count: int
    execution_time_ms: float
    error_message: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogListResponse(BaseModel):
    items: list[AuditLogEntry]
    total: int
