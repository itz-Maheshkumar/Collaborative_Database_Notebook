from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Union
import bcrypt
from jose import jwt, JWTError
from cryptography.fernet import Fernet

from app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Generate bcrypt password hash directly."""
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def create_access_token(
    subject: Union[str, int],
    role: str = "user",
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a JWT access token containing subject (user_id) and role claim."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "role": role,
    }
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict[str, Any]]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None


# ─── Encryption helper for connection credentials at rest ─────────────
def get_fernet() -> Fernet:
    key = settings.FERNET_KEY
    if key == "change-me-generate-with-fernet" or not key:
        key = "dGVzdF9kZXZfZmVybmV0X2tleV9wbGFjZWhvbGRlcg=="
    return Fernet(key.encode() if isinstance(key, str) else key)


def encrypt_string(plain_text: str) -> str:
    """Encrypt a string at rest using Fernet symmetric encryption."""
    f = get_fernet()
    return f.encrypt(plain_text.encode()).decode()


def decrypt_string(cipher_text: str) -> str:
    """Decrypt a string encrypted with Fernet."""
    f = get_fernet()
    return f.decrypt(cipher_text.encode()).decode()
