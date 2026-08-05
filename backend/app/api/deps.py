from typing import AsyncGenerator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.security import decode_access_token
from app.models.user import User, UserRole, UserStatus
from app.services.auth_service import get_user_by_id

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> User:
    """Dependency to retrieve current authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if not payload:
        raise credentials_exception

    sub = payload.get("sub")
    if sub is None:
        raise credentials_exception

    try:
        user_id = int(sub)
    except ValueError:
        raise credentials_exception

    user = await get_user_by_id(db, user_id=user_id)
    if not user:
        raise credentials_exception

    if user.status == UserStatus.BLOCKED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is blocked",
        )

    return user


async def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency requiring user to have admin role."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
