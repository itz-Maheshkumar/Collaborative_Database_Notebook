from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from app.models.connection import DatabaseEngine


class ConnectionBase(BaseModel):
    name: str = Field(..., max_length=100, description="Display name for this connection")
    engine: DatabaseEngine
    host: Optional[str] = None
    port: Optional[int] = None
    database_name: Optional[str] = None
    username: Optional[str] = None
    extra_params: Optional[str] = None


class ConnectionCreate(ConnectionBase):
    password: Optional[str] = None


class ConnectionUpdate(BaseModel):
    name: Optional[str] = None
    engine: Optional[DatabaseEngine] = None
    host: Optional[str] = None
    port: Optional[int] = None
    database_name: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    extra_params: Optional[str] = None


class ConnectionResponse(ConnectionBase):
    id: int
    user_id: int
    has_password: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConnectionTestRequest(BaseModel):
    engine: DatabaseEngine
    host: Optional[str] = None
    port: Optional[int] = None
    database_name: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    extra_params: Optional[str] = None


class ConnectionTestResult(BaseModel):
    success: bool
    message: str
    latency_ms: Optional[float] = None
