
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin
from app.db.session import get_db
from app.models.user import User, UserStatus
from app.schemas.admin import (
    AdminUserResponse,
    AdminUserUpdate,
    AnalyticsOverviewResponse,
    AuditLogListResponse,
)
from app.services.admin_service import (
    get_analytics,
    get_audit_logs,
    get_user_counts,
    list_users,
    update_user,
)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[AdminUserResponse])
async def admin_list_users(
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all users with their aggregated stats. Admin only."""
    return await list_users(db)


@router.patch("/users/{user_id}", response_model=AdminUserResponse)
async def admin_update_user(
    user_id: int,
    body: AdminUserUpdate,
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update a user's role, active status, or display name. Admin only."""
    try:
        updated = await update_user(
            db,
            user_id=user_id,
            role=body.role,
            is_active=body.is_active,
            full_name=body.full_name,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found",
        )
    notebook_count, connection_count, query_count = await get_user_counts(db, updated.id)
    return AdminUserResponse(
        id=updated.id,
        email=updated.email,
        full_name=getattr(updated, "full_name", None),
        role=updated.role,
        is_active=updated.status != UserStatus.BLOCKED,
        created_at=updated.created_at,
        notebook_count=notebook_count,
        connection_count=connection_count,
        query_count=query_count,
    )


@router.get("/analytics", response_model=AnalyticsOverviewResponse)
async def admin_analytics(
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Return platform-wide analytics. Admin only."""
    return await get_analytics(db)


@router.get("/audit-logs", response_model=AuditLogListResponse)
async def admin_audit_logs(
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    status_filter: str | None = Query(None, alias="status"),
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Paginated query audit log across all users. Admin only."""
    return await get_audit_logs(db, limit=limit, offset=offset, status_filter=status_filter)
