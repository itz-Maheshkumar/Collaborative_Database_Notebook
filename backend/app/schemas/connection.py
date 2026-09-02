from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.connection import DatabaseEngine


class ConnectionBase(BaseModel):
    name: str = Field(..., max_length=100, description="Display name for this connection")
    engine: DatabaseEngine
    host: str | None = None
    port: int | None = None
    database_name: str | None = None
    username: str | None = None
    extra_params: str | None = None


class ConnectionCreate(ConnectionBase):
    password: str | None = None


class ConnectionUpdate(BaseModel):
    name: str | None = None
    engine: DatabaseEngine | None = None
    host: str | None = None
    port: int | None = None
    database_name: str | None = None
    username: str | None = None
    password: str | None = None
    extra_params: str | None = None


class ConnectionResponse(ConnectionBase):
    id: int
    user_id: int
    has_password: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConnectionTestRequest(BaseModel):
    engine: DatabaseEngine
    host: str | None = None
    port: int | None = None
    database_name: str | None = None
    username: str | None = None
    password: str | None = None
    extra_params: str | None = None


class ConnectionTestResult(BaseModel):
    success: bool
    message: str
    latency_ms: float | None = None
