from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.tutorial import TutorialProgress

router = APIRouter(prefix="/tutorials", tags=["tutorials"])


# ─── Pydantic Schemas ──────────────────────────────────────────────

class SectionCompleteRequest(BaseModel):
    tutorial_id: str
    section_id: str


class ProgressResponse(BaseModel):
    tutorial_id: str
    section_id: str
    completed_at: datetime

    model_config = {"from_attributes": True}


# ─── Endpoints ─────────────────────────────────────────────────────

@router.get("/progress", response_model=List[ProgressResponse])
async def get_tutorial_progress(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return all tutorial section completions for the current user."""
    result = await db.execute(
        select(TutorialProgress)
        .where(TutorialProgress.user_id == current_user.id)
        .order_by(TutorialProgress.completed_at.asc())
    )
    return result.scalars().all()


@router.post("/progress", status_code=status.HTTP_201_CREATED, response_model=ProgressResponse)
async def mark_section_complete(
    req: SectionCompleteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a tutorial section as completed (idempotent — re-marking is safe)."""
    # Check if already marked
    existing = await db.execute(
        select(TutorialProgress).where(
            TutorialProgress.user_id == current_user.id,
            TutorialProgress.tutorial_id == req.tutorial_id,
            TutorialProgress.section_id == req.section_id,
        )
    )
    record = existing.scalars().first()

    if record:
        return record  # already complete — return existing

    new_record = TutorialProgress(
        user_id=current_user.id,
        tutorial_id=req.tutorial_id,
        section_id=req.section_id,
    )
    db.add(new_record)
    await db.commit()
    await db.refresh(new_record)
    return new_record


@router.delete("/progress/{tutorial_id}", status_code=status.HTTP_204_NO_CONTENT)
async def reset_tutorial_progress(
    tutorial_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Reset all section progress for a given tutorial."""
    await db.execute(
        delete(TutorialProgress).where(
            TutorialProgress.user_id == current_user.id,
            TutorialProgress.tutorial_id == tutorial_id,
        )
    )
    await db.commit()
    return None
