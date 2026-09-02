from datetime import datetime

from pydantic import BaseModel, ConfigDict


class QueryHistoryResponse(BaseModel):
    id: int
    user_id: int
    notebook_id: int | None = None
    cell_id: int | None = None
    connection_id: int | None = None
    engine: str
    query_text: str
    status: str
    row_count: int
    execution_time_ms: float
    error_message: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
