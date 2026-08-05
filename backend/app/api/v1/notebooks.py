from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.notebook import Notebook, NotebookCell
from app.schemas.notebook import (
    NotebookCreate,
    NotebookUpdate,
    NotebookResponse,
    CellCreate,
    CellUpdate,
    CellResponse,
    ReorderCellsRequest,
)

router = APIRouter(prefix="/notebooks", tags=["notebooks"])


@router.post("", response_model=NotebookResponse, status_code=status.HTTP_201_CREATED)
async def create_notebook(
    notebook_in: NotebookCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new notebook with an initial SQL cell."""
    notebook = Notebook(
        user_id=current_user.id,
        title=notebook_in.title,
        description=notebook_in.description,
        connection_id=notebook_in.connection_id,
    )
    db.add(notebook)
    await db.flush()

    # Add initial empty SQL cell
    initial_cell = NotebookCell(
        notebook_id=notebook.id,
        position=0,
        cell_type="sql",
        content="-- Write your SQL or MongoDB query here\nSELECT 1;",
    )
    db.add(initial_cell)
    await db.commit()

    # Fetch complete notebook with cells loaded
    result = await db.execute(
        select(Notebook)
        .options(selectinload(Notebook.cells))
        .where(Notebook.id == notebook.id)
    )
    return result.scalars().first()


@router.get("", response_model=List[NotebookResponse])
async def list_notebooks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all notebooks owned by the authenticated user."""
    result = await db.execute(
        select(Notebook)
        .options(selectinload(Notebook.cells))
        .where(Notebook.user_id == current_user.id)
        .order_by(Notebook.updated_at.desc())
    )
    return result.scalars().all()


@router.get("/{notebook_id}", response_model=NotebookResponse)
async def get_notebook(
    notebook_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get notebook and its ordered cells."""
    result = await db.execute(
        select(Notebook)
        .options(selectinload(Notebook.cells))
        .where(Notebook.id == notebook_id, Notebook.user_id == current_user.id)
    )
    notebook = result.scalars().first()
    if not notebook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Notebook not found"
        )
    return notebook


@router.put("/{notebook_id}", response_model=NotebookResponse)
async def update_notebook(
    notebook_id: int,
    notebook_in: NotebookUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update notebook metadata (title, description, active connection)."""
    result = await db.execute(
        select(Notebook)
        .options(selectinload(Notebook.cells))
        .where(Notebook.id == notebook_id, Notebook.user_id == current_user.id)
    )
    notebook = result.scalars().first()
    if not notebook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Notebook not found"
        )

    update_data = notebook_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(notebook, field, val)

    await db.commit()
    await db.refresh(notebook)
    return notebook


@router.delete("/{notebook_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notebook(
    notebook_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete notebook and all associated cells."""
    result = await db.execute(
        select(Notebook).where(
            Notebook.id == notebook_id, Notebook.user_id == current_user.id
        )
    )
    notebook = result.scalars().first()
    if not notebook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Notebook not found"
        )

    await db.delete(notebook)
    await db.commit()
    return None


# ─── Notebook Cell Endpoints ───────────────────────────────────────────


@router.post("/{notebook_id}/cells", response_model=CellResponse, status_code=status.HTTP_201_CREATED)
async def add_cell(
    notebook_id: int,
    cell_in: CellCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a new cell to the notebook."""
    result = await db.execute(
        select(Notebook).where(
            Notebook.id == notebook_id, Notebook.user_id == current_user.id
        )
    )
    notebook = result.scalars().first()
    if not notebook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Notebook not found"
        )

    cell = NotebookCell(
        notebook_id=notebook.id,
        position=cell_in.position,
        cell_type=cell_in.cell_type,
        content=cell_in.content,
    )
    db.add(cell)
    await db.commit()
    await db.refresh(cell)
    return cell


@router.put("/{notebook_id}/cells/{cell_id}", response_model=CellResponse)
async def update_cell(
    notebook_id: int,
    cell_id: int,
    cell_in: CellUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update cell content, status, or output."""
    result = await db.execute(
        select(NotebookCell)
        .join(Notebook)
        .where(
            NotebookCell.id == cell_id,
            NotebookCell.notebook_id == notebook_id,
            Notebook.user_id == current_user.id,
        )
    )
    cell = result.scalars().first()
    if not cell:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Cell not found"
        )

    update_data = cell_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(cell, field, val)

    await db.commit()
    await db.refresh(cell)
    return cell


@router.delete("/{notebook_id}/cells/{cell_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cell(
    notebook_id: int,
    cell_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a cell from the notebook."""
    result = await db.execute(
        select(NotebookCell)
        .join(Notebook)
        .where(
            NotebookCell.id == cell_id,
            NotebookCell.notebook_id == notebook_id,
            Notebook.user_id == current_user.id,
        )
    )
    cell = result.scalars().first()
    if not cell:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Cell not found"
        )

    await db.delete(cell)
    await db.commit()
    return None


@router.post("/{notebook_id}/reorder", response_model=NotebookResponse)
async def reorder_cells(
    notebook_id: int,
    reorder_req: ReorderCellsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Reorder cells based on an ordered array of cell IDs."""
    result = await db.execute(
        select(Notebook)
        .options(selectinload(Notebook.cells))
        .where(Notebook.id == notebook_id, Notebook.user_id == current_user.id)
    )
    notebook = result.scalars().first()
    if not notebook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Notebook not found"
        )

    cell_map = {cell.id: cell for cell in notebook.cells}
    for idx, cell_id in enumerate(reorder_req.cell_ids):
        if cell_id in cell_map:
            cell_map[cell_id].position = idx

    await db.commit()

    # Re-fetch notebook with updated positions
    result = await db.execute(
        select(Notebook)
        .options(selectinload(Notebook.cells))
        .where(Notebook.id == notebook_id)
    )
    return result.scalars().first()
