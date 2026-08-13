from datetime import datetime, timedelta, timezone
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.models.user import User
from app.models.notebook import Notebook
from app.models.connection import Connection
from app.models.history import QueryHistory
from app.schemas.admin import (
    AdminUserResponse,
    AnalyticsOverviewResponse,
    AuditLogEntry,
    AuditLogListResponse,
)


async def list_users(db: AsyncSession) -> List[AdminUserResponse]:
    """Return all users with per-user aggregated stats."""
    users_result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = users_result.scalars().all()

    # Notebook counts per user
    nb_rows = await db.execute(
        select(Notebook.user_id, func.count(Notebook.id).label("cnt"))
        .group_by(Notebook.user_id)
    )
    nb_map = {row.user_id: row.cnt for row in nb_rows}

    # Connection counts per user
    conn_rows = await db.execute(
        select(Connection.user_id, func.count(Connection.id).label("cnt"))
        .group_by(Connection.user_id)
    )
    conn_map = {row.user_id: row.cnt for row in conn_rows}

    # Query counts per user
    qh_rows = await db.execute(
        select(QueryHistory.user_id, func.count(QueryHistory.id).label("cnt"))
        .group_by(QueryHistory.user_id)
    )
    qh_map = {row.user_id: row.cnt for row in qh_rows}

    result = []
    for u in users:
        result.append(
            AdminUserResponse(
                id=u.id,
                email=u.email,
                full_name=getattr(u, "full_name", None),
                role=u.role,
                is_active=getattr(u, "is_active", True),
                created_at=u.created_at,
                notebook_count=nb_map.get(u.id, 0),
                connection_count=conn_map.get(u.id, 0),
                query_count=qh_map.get(u.id, 0),
            )
        )
    return result


async def update_user(db: AsyncSession, user_id: int, role: Optional[str], is_active: Optional[bool], full_name: Optional[str]) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        return None
    if role is not None:
        user.role = role
    if is_active is not None and hasattr(user, "is_active"):
        user.is_active = is_active
    if full_name is not None and hasattr(user, "full_name"):
        user.full_name = full_name
    await db.commit()
    await db.refresh(user)
    return user


async def get_analytics(db: AsyncSession) -> AnalyticsOverviewResponse:
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)

    total_users = (await db.execute(select(func.count(User.id)))).scalar_one()
    active_users = (await db.execute(
        select(func.count(User.id)).where(User.is_active == True)  # noqa: E712
    )).scalar_one() if hasattr(User, "is_active") else total_users

    total_notebooks = (await db.execute(select(func.count(Notebook.id)))).scalar_one()
    total_connections = (await db.execute(select(func.count(Connection.id)))).scalar_one()
    total_queries = (await db.execute(select(func.count(QueryHistory.id)))).scalar_one()

    successful = (await db.execute(
        select(func.count(QueryHistory.id)).where(QueryHistory.status == "success")
    )).scalar_one()
    failed = (await db.execute(
        select(func.count(QueryHistory.id)).where(QueryHistory.status == "error")
    )).scalar_one()

    avg_time_row = (await db.execute(
        select(func.avg(QueryHistory.execution_time_ms))
    )).scalar_one()
    avg_time = round(float(avg_time_row or 0), 2)

    new_users = (await db.execute(
        select(func.count(User.id)).where(User.created_at >= seven_days_ago)
    )).scalar_one()

    queries_7d = (await db.execute(
        select(func.count(QueryHistory.id)).where(QueryHistory.created_at >= seven_days_ago)
    )).scalar_one()

    return AnalyticsOverviewResponse(
        total_users=total_users,
        active_users=active_users,
        total_notebooks=total_notebooks,
        total_connections=total_connections,
        total_queries_executed=total_queries,
        successful_queries=successful,
        failed_queries=failed,
        avg_query_time_ms=avg_time,
        new_users_last_7d=new_users,
        queries_last_7d=queries_7d,
    )


async def get_audit_logs(
    db: AsyncSession,
    limit: int = 100,
    offset: int = 0,
    status_filter: Optional[str] = None,
) -> AuditLogListResponse:
    stmt = (
        select(QueryHistory, User.email.label("user_email"))
        .join(User, QueryHistory.user_id == User.id)
    )
    if status_filter:
        stmt = stmt.where(QueryHistory.status == status_filter)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    stmt = stmt.order_by(QueryHistory.created_at.desc()).limit(limit).offset(offset)
    rows = await db.execute(stmt)

    items = []
    for qh, user_email in rows:
        items.append(
            AuditLogEntry(
                id=qh.id,
                user_id=qh.user_id,
                user_email=user_email,
                engine=qh.engine,
                query_text=qh.query_text,
                status=qh.status,
                row_count=qh.row_count,
                execution_time_ms=qh.execution_time_ms,
                error_message=qh.error_message,
                created_at=qh.created_at,
            )
        )

    return AuditLogListResponse(items=items, total=total)
