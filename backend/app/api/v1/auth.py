from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.services.auth_service import (
    get_user_by_email,
    get_user_by_username,
    create_user,
    authenticate_user,
)
from app.core.security import create_access_token
from app.api.deps import get_current_user
from app.models.user import User, UserStatus

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user account."""
    existing_email = await get_user_by_email(db, user_in.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )

    existing_username = await get_user_by_username(db, user_in.username)
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this username already exists",
        )

    user = await create_user(db, user_in)
    return user


@router.post("/login", response_model=Token)
async def login(
    login_data: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    """Log in with email and password to receive a JWT access token."""
    user = await authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.status == UserStatus.BLOCKED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been blocked. Please contact support.",
        )

    access_token = create_access_token(subject=user.id, role=user.role.value)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user,
    )


@router.post("/login/form", response_model=Token)
async def login_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """OAuth2 compatible token login (uses username form field as email)."""
    user = await authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.status == UserStatus.BLOCKED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been blocked.",
        )

    access_token = create_access_token(subject=user.id, role=user.role.value)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user,
    )


@router.get("/me", response_model=UserResponse)
async def read_current_user(
    current_user: User = Depends(get_current_user),
):
    """Retrieve details for the currently authenticated user."""
    return current_user
