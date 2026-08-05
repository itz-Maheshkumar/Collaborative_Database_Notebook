from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Notebook(Base):
    __tablename__ = "notebooks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    connection_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("connections.id", ondelete="SET NULL"), nullable=True, index=True
    )
    title: Mapped[str] = mapped_column(String(255), default="Untitled Notebook", nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user = relationship("User", backref="notebooks")
    connection = relationship("Connection", backref="notebooks")
    cells: Mapped[List["NotebookCell"]] = relationship(
        "NotebookCell",
        back_populates="notebook",
        cascade="all, delete-orphan",
        order_by="NotebookCell.position",
    )


class NotebookCell(Base):
    __tablename__ = "notebook_cells"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    notebook_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("notebooks.id", ondelete="CASCADE"), nullable=False, index=True
    )
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    cell_type: Mapped[str] = mapped_column(String(20), default="sql", nullable=False)  # sql, code, markdown
    content: Mapped[str] = mapped_column(Text, default="", nullable=False)
    last_output: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON or raw output
    status: Mapped[str] = mapped_column(String(20), default="idle", nullable=False)  # idle, running, success, error
    execution_time_ms: Mapped[Optional[float]] = mapped_column(nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationship
    notebook: Mapped["Notebook"] = relationship("Notebook", back_populates="cells")
