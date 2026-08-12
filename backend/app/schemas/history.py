from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class QueryHistoryResponse(BaseModel):
    id: int
    user_id: int
    notebook_id: Optional[int] = None
    cell_id: Optional[int] = None
    connection_id: Optional[int] = None
    engine: str
    query_text: str
    status: str
    row_count: int
    execution_time_ms: float
    error_message: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
