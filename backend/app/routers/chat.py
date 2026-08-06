from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
import logging
import uuid

from app.core.dependencies import get_db, get_current_user
from app.db.models import User, Thread, Message
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    DomainSuggestion,
    MessageOut,
    SelectDomainRequest,
)

logger = logging.getLogger(__name__)
from app.agent.graph import get_graph

router = APIRouter()


# ---------------------------------------------------------------------------
# POST /chat  — send a message, get agent verdict back
# ---------------------------------------------------------------------------
@router.post("/", response_model=ChatResponse, status_code=status.HTTP_200_OK)
async def chat(
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # ── 1. Resolve or create thread ─────────────────────────────────────────
    if body.thread_id:
        result = await db.execute(
            select(Thread).where(
                Thread.id == body.thread_id,
                Thread.user_id == current_user.id,
            )
        )
        thread = result.scalar_one_or_none()
        if not thread:
            raise HTTPException(status_code=404, detail="Thread not found")
        # Bump updated_at so this thread sorts to the top of the history list.
        # (SQLAlchemy's onupdate only fires on an actual UPDATE — reusing an
        # existing thread with only new Message rows never triggers it otherwise.)
        thread.updated_at = datetime.now(timezone.utc)
    else:
        thread = Thread(
            user_id=current_user.id,
            # Use first 60 chars of prompt as a generated title
            title=body.prompt[:60],
        )
        db.add(thread)
        await db.flush()  # get thread.id without committing

    # ── 2. Persist user message ──────────────────────────────────────────────
    user_msg = Message(
        thread_id=thread.id,
        role="user",
        content=body.prompt,
    )
    db.add(user_msg)

    # ── 3. Run LangGraph agent ───────────────────────────────────────────────
    # thread_id ties this call to the checkpointer's saved state for this
    # conversation, so the graph can resume/build on it once node logic
    # is updated to use prior turns (not yet — see note in agent/nodes.py).
    config = {"configurable": {"thread_id": str(thread.id)}}
    try:
        graph = await get_graph()
        result = await graph.ainvoke({"user_input": body.prompt}, config=config)
    except Exception as exc:
        # Full traceback to the terminal — type(exc).__name__ matters more than
        # str(exc) here, since some exceptions (asyncio.TimeoutError, etc.)
        # stringify to an empty message.
        logger.exception("Agent invocation failed")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Agent error: {type(exc).__name__}: {exc}",
        )

    verdict: str = result.get("verdict", "")
    top3_raw: list[dict] = result.get("top3suggestions", [])
    sorted_confidence: list[dict] = result.get("sorted_confidence", [])

    # Build a lookup so we can attach confidence + description to each top-3 type
    conf_map = {r["type"]: r for r in sorted_confidence}

    top3_suggestions: list[DomainSuggestion] = [
        DomainSuggestion(
            type=t,
            confidence=conf_map.get(t, {}).get("confidence", 0.0),
            description=conf_map.get(t, {}).get("description", ""),
        )
        for t in top3_raw
    ]

    # ── 4. Persist assistant message ─────────────────────────────────────────
    assistant_msg = Message(
        thread_id=thread.id,
        role="assistant",
        content=verdict,
        top3=[s.model_dump() for s in top3_suggestions],
    )
    db.add(assistant_msg)
    await db.commit()

    return ChatResponse(
        thread_id=thread.id,
        verdict=verdict,
        top3=top3_suggestions,
    )


# ---------------------------------------------------------------------------
# GET /chat/{thread_id}/messages  — fetch full message history for a thread
# ---------------------------------------------------------------------------
@router.get(
    "/{thread_id}/messages",
    response_model=list[MessageOut],
    status_code=status.HTTP_200_OK,
)
async def get_messages(
    thread_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify thread belongs to user
    thread_result = await db.execute(
        select(Thread).where(
            Thread.id == thread_id,
            Thread.user_id == current_user.id,
        )
    )
    thread = thread_result.scalar_one_or_none()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    messages_result = await db.execute(
        select(Message)
        .where(Message.thread_id == thread_id)
        .order_by(Message.created_at)
    )
    return messages_result.scalars().all()


# ---------------------------------------------------------------------------
# PATCH /chat/{thread_id}/messages/{message_id}/select-domain
# — let the user confirm which domain they agree with
# ---------------------------------------------------------------------------
@router.patch(
    "/{thread_id}/messages/{message_id}/select-domain",
    response_model=MessageOut,
    status_code=status.HTTP_200_OK,
)
async def select_domain(
    thread_id: uuid.UUID,
    message_id: uuid.UUID,
    body: SelectDomainRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify thread ownership
    thread_result = await db.execute(
        select(Thread).where(
            Thread.id == thread_id,
            Thread.user_id == current_user.id,
        )
    )
    if not thread_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Thread not found")

    msg_result = await db.execute(
        select(Message).where(
            Message.id == message_id,
            Message.thread_id == thread_id,
            Message.role == "assistant",
        )
    )
    message = msg_result.scalar_one_or_none()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    message.selected_domain = body.selected_domain
    await db.commit()
    await db.refresh(message)
    return message