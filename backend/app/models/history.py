from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, Float, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class QueryHistory(Base):
    __tablename__ = "query_history"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    notebook_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("notebooks.id", ondelete="SET NULL"), nullable=True, index=True
    )
    cell_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("notebook_cells.id", ondelete="SET NULL"), nullable=True, index=True
    )
    connection_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("connections.id", ondelete="SET NULL"), nullable=True, index=True
    )
    engine: Mapped[str] = mapped_column(String(50), nullable=False)
    query_text: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)  # success, error
    row_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    execution_time_ms: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    # Relationships
    user = relationship("User", backref="query_history")
    notebook = relationship("Notebook", backref="query_history")
    connection = relationship("Connection", backref="query_history")
