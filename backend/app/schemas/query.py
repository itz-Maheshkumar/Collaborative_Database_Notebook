from typing import Any

from pydantic import BaseModel


class QueryExecuteRequest(BaseModel):
    cell_id: int
    connection_id: int
    query_text: str


class QueryExecuteResponse(BaseModel):
    success: bool
    columns: list[str] = []
    rows: list[dict[str, Any]] = []
    row_count: int = 0
    execution_time_ms: float = 0.0
    error_message: str | None = None
    engine: str | None = None
