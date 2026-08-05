from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class CellBase(BaseModel):
    position: int = 0
    cell_type: str = Field("sql", description="sql, code, or markdown")
    content: str = ""


class CellCreate(CellBase):
    pass


class CellUpdate(BaseModel):
    position: Optional[int] = None
    cell_type: Optional[str] = None
    content: Optional[str] = None
    last_output: Optional[str] = None
    status: Optional[str] = None
    execution_time_ms: Optional[float] = None


class CellResponse(CellBase):
    id: int
    notebook_id: int
    last_output: Optional[str] = None
    status: str
    execution_time_ms: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotebookBase(BaseModel):
    title: str = Field("Untitled Notebook", max_length=255)
    description: Optional[str] = None
    connection_id: Optional[int] = None


class NotebookCreate(NotebookBase):
    pass


class NotebookUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    connection_id: Optional[int] = None


class NotebookResponse(NotebookBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    cells: List[CellResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ReorderCellsRequest(BaseModel):
    cell_ids: List[int]
