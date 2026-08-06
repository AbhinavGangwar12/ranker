import uuid
from sqlalchemy import Column, String, Text, ForeignKey, TIMESTAMP, func, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.db.session import Base

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    threads = relationship("Thread", back_populates="user", cascade="all, delete-orphan")

class Thread(Base):
    __tablename__ = "threads"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="threads")
    messages = relationship("Message", back_populates="thread", cascade="all, delete-orphan", order_by="Message.created_at")

class Message(Base):
    __tablename__ = "messages"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    thread_id = Column(UUID(as_uuid=True), ForeignKey("threads.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False)  # e.g., "user" or "assistant"
    content = Column(Text, nullable=False)
    top3 = Column(JSONB, nullable=True)  # Store additional metadata as JSON
    selected_domain = Column(String, nullable=True)  # Store the selected domain as a string
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    thread = relationship("Thread", back_populates="messages")

    __table_args__ = (
        Index("ix_messages_thread_created", "thread_id", "created_at"),
    )