from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class TutorialProgress(Base):
    """Tracks which tutorial sections a user has completed."""

    __tablename__ = "tutorial_progress"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    tutorial_id: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g. "postgresql"
    section_id: Mapped[str] = mapped_column(String(100), nullable=False)   # e.g. "joins"
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        # Unique per user + tutorial + section
        {"sqlite_autoincrement": True},
    )
