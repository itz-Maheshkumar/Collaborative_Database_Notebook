from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class QueryExecuteRequest(BaseModel):
    cell_id: int
    connection_id: int
    query_text: str


class QueryExecuteResponse(BaseModel):
    success: bool
    columns: List[str] = []
    rows: List[Dict[str, Any]] = []
    row_count: int = 0
    execution_time_ms: float = 0.0
    error_message: Optional[str] = None
    engine: Optional[str] = None
