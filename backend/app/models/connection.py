import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, DateTime, Enum, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class DatabaseEngine(str, enum.Enum):
    POSTGRESQL = "postgresql"
    MYSQL = "mysql"
    MONGODB = "mongodb"
    SQLITE = "sqlite"


class Connection(Base):
    __tablename__ = "connections"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    engine: Mapped[DatabaseEngine] = mapped_column(
        Enum(DatabaseEngine), nullable=False, index=True
    )
    host: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    port: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    database_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    username: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    encrypted_password: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    extra_params: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON or query string params

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationship to user
    user = relationship("User", backref="connections")
