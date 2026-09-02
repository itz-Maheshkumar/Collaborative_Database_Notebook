from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CellBase(BaseModel):
    position: int = 0
    cell_type: str = Field("sql", description="sql, code, or markdown")
    content: str = ""


class CellCreate(CellBase):
    pass


class CellUpdate(BaseModel):
    position: int | None = None
    cell_type: str | None = None
    content: str | None = None
    last_output: str | None = None
    status: str | None = None
    execution_time_ms: float | None = None


class CellResponse(CellBase):
    id: int
    notebook_id: int
    last_output: str | None = None
    status: str
    execution_time_ms: float | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotebookBase(BaseModel):
    title: str = Field("Untitled Notebook", max_length=255)
    description: str | None = None
    connection_id: int | None = None


class NotebookCreate(NotebookBase):
    pass


class NotebookUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    connection_id: int | None = None


class NotebookResponse(NotebookBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    cells: list[CellResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ReorderCellsRequest(BaseModel):
    cell_ids: list[int]
