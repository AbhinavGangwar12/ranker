from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.db.session import Base, engine
from app.agent.checkpointer import close_pool
from app.routers import auth, threads, chat

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()
    await close_pool()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router, prefix="/auth", tags=['auth'])
app.include_router(threads.router, prefix="/threads", tags=['threads'])
app.include_router(chat.router, prefix="/chat", tags=['chat'])

@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok", "version": settings.PROJECT_VERSION}