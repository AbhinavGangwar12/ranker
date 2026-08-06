from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.core.dependencies import get_db, get_current_user
from app.db.models import Thread, User
from app.schemas.thread import ThreadCreate, ThreadOut

router = APIRouter()

@router.get("/", response_model=list[ThreadOut])
async def list_threads(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Thread).where(Thread.user_id == current_user.id).order_by(Thread.updated_at.desc()))
    return result.scalars().all()

@router.post("/", response_model=ThreadOut, status_code=status.HTTP_201_CREATED)
async def create_thread(
    body: ThreadCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    thread = Thread(user_id=current_user.id, title=body.title)
    db.add(thread)
    await db.commit()
    await db.refresh(thread)
    return thread

@router.get("/{thread_id}", response_model=ThreadOut)
async def get_thread(
    thread_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Thread).where(Thread.id == thread_id, Thread.user_id == current_user.id))
    thread = result.scalar_one_or_none()
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thread not found"
        )
    return thread

@router.delete("/{thread_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_thread(
    thread_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Thread).where(Thread.id == thread_id, Thread.user_id == current_user.id))
    thread = result.scalar_one_or_none()
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thread not found"
        )
    await db.delete(thread)
    await db.commit()