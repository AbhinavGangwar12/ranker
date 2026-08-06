from pydantic import BaseModel 
from datetime import datetime
from uuid import UUID

class ThreadOut(BaseModel):
    id: UUID
    title: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ThreadCreate(BaseModel):
    title: str | None = None