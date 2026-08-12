from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.schema import SchemaTreeResponse
from app.services.query_service import get_connection_params
from app.services.schema_service import get_schema_tree

router = APIRouter(prefix="/schema", tags=["schema"])


@router.get("/{connection_id}", response_model=SchemaTreeResponse)
async def get_connection_schema(
    connection_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Introspect database schema for a given connection ID.
    Returns tables/collections, column names, and data types.
    """
    params = await get_connection_params(db, connection_id, current_user.id)
    if not params:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found or access denied",
        )

    schema_tree = await get_schema_tree(params)
    return schema_tree
