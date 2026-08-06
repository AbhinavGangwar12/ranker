# """
# Provides a singleton AsyncPostgresSaver checkpointer so agent state persists
# across invocations and threads can be resumed.

# IMPORTANT: graph.ainvoke() requires an ASYNC checkpointer. PostgresSaver
# (sync) only implements get_tuple/put/etc — calling it from an async graph
# raises NotImplementedError on aget_tuple. AsyncPostgresSaver + an
# AsyncConnectionPool is the correct pairing for async invocation.

# Usage
# -----
# from app.agent.checkpointer import get_checkpointer
# checkpointer = await get_checkpointer()   # safe to call multiple times, cached after first call
# """

# import asyncio
# from psycopg_pool import AsyncConnectionPool
# from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
# from app.core.config import settings

# _pool: AsyncConnectionPool | None = None
# _checkpointer: AsyncPostgresSaver | None = None
# _lock = asyncio.Lock()


# def _to_psycopg_dsn(url: str) -> str:
#     """Strip the SQLAlchemy async driver suffix — psycopg wants a plain postgresql:// DSN."""
#     return (
#         url
#         .replace("postgresql+asyncpg://", "postgresql://")
#         .replace("postgresql+psycopg2://", "postgresql://")
#         .replace("postgresql+psycopg://", "postgresql://")
#     )


# async def get_checkpointer() -> AsyncPostgresSaver:
#     """Returns a cached AsyncPostgresSaver backed by an async connection pool.
#     .setup() has already been run — safe to use immediately for graph.compile(checkpointer=...)."""
#     global _pool, _checkpointer

#     if _checkpointer is None:
#         async with _lock:
#             if _checkpointer is None:  # re-check inside the lock (avoids a race on first request)
#                 dsn = _to_psycopg_dsn(settings.DATABASE_URL)
#                 _pool = AsyncConnectionPool(
#                     conninfo=dsn,
#                     max_size=10,
#                     kwargs={"autocommit": True, "prepare_threshold": 0},
#                     open=False,
#                 )
#                 await _pool.open()
#                 _checkpointer = AsyncPostgresSaver(_pool)
#                 await _checkpointer.setup()   # creates langgraph's internal checkpoint tables if missing

#     return _checkpointer


# async def close_pool():
#     """Call this on FastAPI shutdown to release connections cleanly."""
#     global _pool
#     if _pool is not None:
#         await _pool.close()
#         _pool = None

"""
Provides a singleton AsyncPostgresSaver checkpointer so agent state persists
across invocations and threads can be resumed.

IMPORTANT: graph.ainvoke() requires an ASYNC checkpointer. PostgresSaver
(sync) only implements get_tuple/put/etc — calling it from an async graph
raises NotImplementedError on aget_tuple. AsyncPostgresSaver + an
AsyncConnectionPool is the correct pairing for async invocation.

Usage
-----
from app.agent.checkpointer import get_checkpointer
checkpointer = await get_checkpointer()   # safe to call multiple times, cached after first call
"""

import asyncio
from psycopg_pool import AsyncConnectionPool
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from app.core.config import settings

_pool: AsyncConnectionPool | None = None
_checkpointer: AsyncPostgresSaver | None = None
_lock = asyncio.Lock()


def _to_psycopg_dsn(url: str) -> str:
    """Strip the SQLAlchemy async driver suffix — psycopg wants a plain postgresql:// DSN.
    Unlike asyncpg (see db/session.py's _to_asyncpg_url), psycopg understands the
    libpq-style `sslmode=` parameter natively, so it's intentionally left untouched
    here. DATABASE_URL should stay in its original Neon form (sslmode=, not ssl=)."""
    return (
        url
        .replace("postgresql+asyncpg://", "postgresql://")
        .replace("postgresql+psycopg2://", "postgresql://")
        .replace("postgresql+psycopg://", "postgresql://")
    )


async def get_checkpointer() -> AsyncPostgresSaver:
    """Returns a cached AsyncPostgresSaver backed by an async connection pool.
    .setup() has already been run — safe to use immediately for graph.compile(checkpointer=...)."""
    global _pool, _checkpointer

    if _checkpointer is None:
        async with _lock:
            if _checkpointer is None:  # re-check inside the lock (avoids a race on first request)
                dsn = _to_psycopg_dsn(settings.DATABASE_URL)
                _pool = AsyncConnectionPool(
                    conninfo=dsn,
                    max_size=10,
                    kwargs={"autocommit": True, "prepare_threshold": 0},
                    open=False,
                )
                await _pool.open()
                _checkpointer = AsyncPostgresSaver(_pool)
                await _checkpointer.setup()   # creates langgraph's internal checkpoint tables if missing

    return _checkpointer


async def close_pool():
    """Call this on FastAPI shutdown to release connections cleanly."""
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None