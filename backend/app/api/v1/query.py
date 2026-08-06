import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.notebook import Notebook, NotebookCell
from app.schemas.query import QueryExecuteRequest, QueryExecuteResponse
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
    Updates the cell's last_output, status, and execution_time_ms in the DB.
    """
    # 1 — Verify the cell belongs to this user's notebook
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

    # 2 — Mark cell as running
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

    # 5 — Persist output back to cell
    cell.status = "success" if result["success"] else "error"
    cell.execution_time_ms = result.get("execution_time_ms", 0.0)
    cell.last_output = json.dumps(
        {
            "success": result["success"],
            "columns": result.get("columns", []),
            "rows": result.get("rows", []),
            "row_count": result.get("row_count", 0),
            "execution_time_ms": result.get("execution_time_ms", 0.0),
            "error_message": result.get("error_message"),
            "engine": result.get("engine"),
        },
        default=str,
    )
    await db.commit()

    return QueryExecuteResponse(
        success=result["success"],
        columns=result.get("columns", []),
        rows=result.get("rows", []),
        row_count=result.get("row_count", 0),
        execution_time_ms=result.get("execution_time_ms", 0.0),
        error_message=result.get("error_message"),
        engine=result.get("engine"),
    )
