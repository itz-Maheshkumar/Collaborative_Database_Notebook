
from pydantic import BaseModel


class ColumnInfo(BaseModel):
    name: str
    data_type: str = "unknown"
    is_nullable: bool = True
    is_primary_key: bool = False


class TableInfo(BaseModel):
    name: str
    type: str = "table"  # "table", "view", "collection"
    columns: list[ColumnInfo] = []


class SchemaTreeResponse(BaseModel):
    engine: str
    database_name: str
    tables: list[TableInfo] = []
    error_message: str | None = None
