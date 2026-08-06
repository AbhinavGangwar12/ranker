# from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
# from sqlalchemy.orm import DeclarativeBase
# from app.core.config import settings


# class Base(DeclarativeBase):
#     pass


# engine = create_async_engine(settings.DATABASE_URL, echo=settings.DB_ECHO)

# AsyncSessionLocal = async_sessionmaker(
#     engine, expire_on_commit=False, autocommit=False, autoflush=False
# )


# async def get_db() -> AsyncSession:
#     async with AsyncSessionLocal() as session:
#         yield session
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings


class Base(DeclarativeBase):
    pass


def _to_asyncpg_url(url: str) -> str:
    """asyncpg (SQLAlchemy's async Postgres driver) expects the query param named
    `ssl=`, not the libpq-style `sslmode=` that Neon gives you natively. psycopg
    (used separately by the LangGraph checkpointer, see agent/checkpointer.py)
    wants the opposite — it understands `sslmode=` directly and does NOT accept
    `ssl=`. Keep DATABASE_URL in its original Neon form (sslmode=) and translate
    per-driver here, rather than hand-editing the env var to satisfy one driver
    and breaking the other."""
    return url.replace("sslmode=", "ssl=")


engine = create_async_engine(
    _to_asyncpg_url(settings.DATABASE_URL),
    echo=settings.DB_ECHO,
    pool_pre_ping=True,   # verifies a pooled connection is alive before reuse —
                           # Neon silently drops idle connections (e.g. around
                           # its auto-suspend/resume cycle), and without this,
                           # the first query after idle time fails with
                           # "connection is closed" instead of transparently
                           # reconnecting.
    pool_size=5,
    max_overflow=10,
)

AsyncSessionLocal = async_sessionmaker(
    engine, expire_on_commit=False, autocommit=False, autoflush=False
)


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session