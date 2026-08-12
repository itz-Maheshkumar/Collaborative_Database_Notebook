import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.notebook import Notebook, NotebookCell
from app.models.history import QueryHistory
from app.schemas.query import QueryExecuteRequest, QueryExecuteResponse
from app.schemas.history import QueryHistoryResponse
from app.services.query_service import get_connection_params, execute_query

router = APIRouter(prefix="/query", tags=["query"])


@router.post("/execute", response_model=QueryExecuteResponse)
async def execute_cell_query(
    req: QueryExecuteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Execute the query text of a notebook cell against its assigned connection.
    Updates the cell's last_output, status, and execution_time_ms in the DB,
    and records an entry in QueryHistory.
    """
    # 1 — Verify cell ownership
    cell_result = await db.execute(
        select(NotebookCell)
        .join(Notebook)
        .where(
            NotebookCell.id == req.cell_id,
            Notebook.user_id == current_user.id,
        )
    )
    cell = cell_result.scalars().first()
    if not cell:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cell not found or access denied",
        )

    # 2 — Mark cell running
    cell.status = "running"
    await db.commit()

    # 3 — Resolve connection params
    params = await get_connection_params(db, req.connection_id, current_user.id)
    if params is None:
        cell.status = "error"
        cell.last_output = json.dumps({"error": "Connection not found"})
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found or access denied",
        )

    # 4 — Execute query
    result = await execute_query(params, req.query_text)

    # 5 — Update cell state
    is_success = result["success"]
    cell.status = "success" if is_success else "error"
    cell.execution_time_ms = result.get("execution_time_ms", 0.0)
    cell.last_output = json.dumps(
        {
            "success": is_success,
            "columns": result.get("columns", []),
            "rows": result.get("rows", []),
            "row_count": result.get("row_count", 0),
            "execution_time_ms": result.get("execution_time_ms", 0.0),
            "error_message": result.get("error_message"),
            "engine": result.get("engine"),
        },
        default=str,
    )

    # 6 — Log into QueryHistory
    history_entry = QueryHistory(
        user_id=current_user.id,
        notebook_id=cell.notebook_id,
        cell_id=cell.id,
        connection_id=req.connection_id,
        engine=result.get("engine") or str(params.get("engine", "")),
        query_text=req.query_text,
        status="success" if is_success else "error",
        row_count=result.get("row_count", 0),
        execution_time_ms=result.get("execution_time_ms", 0.0),
        error_message=result.get("error_message"),
    )
    db.add(history_entry)

    await db.commit()

    return QueryExecuteResponse(
        success=is_success,
        columns=result.get("columns", []),
        rows=result.get("rows", []),
        row_count=result.get("row_count", 0),
        execution_time_ms=result.get("execution_time_ms", 0.0),
        error_message=result.get("error_message"),
        engine=result.get("engine"),
    )


@router.get("/history", response_model=List[QueryHistoryResponse])
async def list_query_history(
    notebook_id: Optional[int] = Query(None),
    connection_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(100, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve executed query history logs for the current user."""
    stmt = select(QueryHistory).where(QueryHistory.user_id == current_user.id)

    if notebook_id is not None:
        stmt = stmt.where(QueryHistory.notebook_id == notebook_id)
    if connection_id is not None:
        stmt = stmt.where(QueryHistory.connection_id == connection_id)
    if status_filter is not None:
        stmt = stmt.where(QueryHistory.status == status_filter)

    stmt = stmt.order_by(QueryHistory.created_at.desc()).limit(limit)

    result = await db.execute(stmt)
    return result.scalars().all()


@router.delete("/history", status_code=status.HTTP_204_NO_CONTENT)
async def clear_query_history(
    notebook_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Clear query history logs for the current user (optionally scoped to a notebook)."""
    stmt = delete(QueryHistory).where(QueryHistory.user_id == current_user.id)
    if notebook_id is not None:
        stmt = stmt.where(QueryHistory.notebook_id == notebook_id)

    await db.execute(stmt)
    await db.commit()
    return None
