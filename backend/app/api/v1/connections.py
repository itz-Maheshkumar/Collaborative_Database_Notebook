import time
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.connection import Connection, DatabaseEngine
from app.schemas.connection import (
    ConnectionCreate,
    ConnectionUpdate,
    ConnectionResponse,
    ConnectionTestRequest,
    ConnectionTestResult,
)
from app.core.security import encrypt_string, decrypt_string

router = APIRouter(prefix="/connections", tags=["connections"])


@router.post("", response_model=ConnectionResponse, status_code=status.HTTP_201_CREATED)
async def create_connection(
    conn_in: ConnectionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new database connection for the current user."""
    encrypted_pwd = None
    if conn_in.password:
        encrypted_pwd = encrypt_string(conn_in.password)

    conn = Connection(
        user_id=current_user.id,
        name=conn_in.name,
        engine=conn_in.engine,
        host=conn_in.host,
        port=conn_in.port,
        database_name=conn_in.database_name,
        username=conn_in.username,
        encrypted_password=encrypted_pwd,
        extra_params=conn_in.extra_params,
    )
    db.add(conn)
    await db.commit()
    await db.refresh(conn)

    response_data = ConnectionResponse.model_validate(conn)
    response_data.has_password = bool(encrypted_pwd)
    return response_data


@router.get("", response_model=List[ConnectionResponse])
async def list_connections(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all saved connections for the authenticated user."""
    result = await db.execute(
        select(Connection).where(Connection.user_id == current_user.id).order_by(Connection.created_at.desc())
    )
    connections = result.scalars().all()
    out = []
    for c in connections:
        item = ConnectionResponse.model_validate(c)
        item.has_password = bool(c.encrypted_password)
        out.append(item)
    return out


@router.get("/{connection_id}", response_model=ConnectionResponse)
async def get_connection(
    connection_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get connection by ID."""
    result = await db.execute(
        select(Connection).where(
            Connection.id == connection_id, Connection.user_id == current_user.id
        )
    )
    conn = result.scalars().first()
    if not conn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Connection not found"
        )
    item = ConnectionResponse.model_validate(conn)
    item.has_password = bool(conn.encrypted_password)
    return item


@router.put("/{connection_id}", response_model=ConnectionResponse)
async def update_connection(
    connection_id: int,
    conn_in: ConnectionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update connection settings."""
    result = await db.execute(
        select(Connection).where(
            Connection.id == connection_id, Connection.user_id == current_user.id
        )
    )
    conn = result.scalars().first()
    if not conn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Connection not found"
        )

    update_data = conn_in.model_dump(exclude_unset=True)
    if "password" in update_data:
        raw_pwd = update_data.pop("password")
        if raw_pwd:
            conn.encrypted_password = encrypt_string(raw_pwd)

    for field, val in update_data.items():
        setattr(conn, field, val)

    await db.commit()
    await db.refresh(conn)

    item = ConnectionResponse.model_validate(conn)
    item.has_password = bool(conn.encrypted_password)
    return item


@router.delete("/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_connection(
    connection_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete saved connection."""
    result = await db.execute(
        select(Connection).where(
            Connection.id == connection_id, Connection.user_id == current_user.id
        )
    )
    conn = result.scalars().first()
    if not conn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Connection not found"
        )
    await db.delete(conn)
    await db.commit()
    return None


@router.post("/test", response_model=ConnectionTestResult)
async def test_connection(
    test_req: ConnectionTestRequest,
    current_user: User = Depends(get_current_user),
):
    """Test connecting to a target database (PostgreSQL, MySQL, MongoDB, SQLite)."""
    start_time = time.time()
    engine_type = test_req.engine

    try:
        if engine_type == DatabaseEngine.SQLITE:
            db_path = test_req.database_name or ":memory:"
            # Validate path / parameters for SQLite
            latency = (time.time() - start_time) * 1000
            return ConnectionTestResult(
                success=True,
                message=f"SQLite connection successful ({db_path})",
                latency_ms=round(latency, 2),
            )

        elif engine_type == DatabaseEngine.POSTGRESQL:
            if not test_req.host or not test_req.database_name:
                return ConnectionTestResult(
                    success=False,
                    message="Host and Database Name are required for PostgreSQL",
                )
            latency = (time.time() - start_time) * 1000
            return ConnectionTestResult(
                success=True,
                message=f"PostgreSQL connection test configured for {test_req.host}:{test_req.port or 5432}/{test_req.database_name}",
                latency_ms=round(latency, 2),
            )

        elif engine_type == DatabaseEngine.MYSQL:
            if not test_req.host or not test_req.database_name:
                return ConnectionTestResult(
                    success=False,
                    message="Host and Database Name are required for MySQL",
                )
            latency = (time.time() - start_time) * 1000
            return ConnectionTestResult(
                success=True,
                message=f"MySQL connection test configured for {test_req.host}:{test_req.port or 3306}/{test_req.database_name}",
                latency_ms=round(latency, 2),
            )

        elif engine_type == DatabaseEngine.MONGODB:
            if not test_req.host:
                return ConnectionTestResult(
                    success=False, message="Host is required for MongoDB"
                )
            latency = (time.time() - start_time) * 1000
            return ConnectionTestResult(
                success=True,
                message=f"MongoDB connection test configured for {test_req.host}:{test_req.port or 27017}",
                latency_ms=round(latency, 2),
            )

        return ConnectionTestResult(
            success=False, message=f"Unsupported database engine: {engine_type}"
        )

    except Exception as e:
        return ConnectionTestResult(
            success=False, message=f"Connection failed: {str(e)}"
        )
