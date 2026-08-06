from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class ChatRequest(BaseModel):
    prompt: str
    thread_id: UUID | None = None   # None = start new thread


class DomainSuggestion(BaseModel):
    type: str
    confidence: float
    description: str


class ChatResponse(BaseModel):
    thread_id: UUID
    verdict: str
    top3: list[DomainSuggestion]


class MessageOut(BaseModel):
    id: UUID
    role: str
    content: str
    top3: list[DomainSuggestion] | None
    selected_domain: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class SelectDomainRequest(BaseModel):
    selected_domain: str