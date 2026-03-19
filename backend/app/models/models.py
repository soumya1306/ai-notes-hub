# All models (tables) will be defined here.

"""
This code is pretty self explanatory, we are creating a model for the table that will be created. Defining the columns and its constraints.
"""

import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import String, ARRAY, DateTime, ForeignKey, Text, Index, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=True)
    google_id: Mapped[Optional[str]] = mapped_column(String, unique=True, nullable=True)
    refresh_token: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    attachments: Mapped[list["Attachment"]] = relationship(
        "Attachment", back_populates="user", cascade="all, delete-orphan"
    )
    note_permissions: Mapped[list["NotePermission"]] = relationship(
        "NotePermission", back_populates="user", cascade="all delete-orphan"
    )


class Note(Base):
    __tablename__ = "notes"

    # Mapped[type] tells Python the exact type (str, uuid, etc.)
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    tags: Mapped[List[str]] = mapped_column(ARRAY(String), default=list)

    embedding: Mapped[Optional[List[float]]] = mapped_column(Vector(768), nullable=True)

    # Use server_default or a callable (no parens) for timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    attachments: Mapped[list["Attachment"]] = relationship(
        "Attachment", back_populates="note", cascade="all, delete-orphan"
    )
    permissions: Mapped[list["NotePermission"]] = relationship(
        "NotePermission", back_populates="note", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index(
            "ix_notes_embedding_hnsw",
            "embedding",
            postgresql_using="hnsw",
            postgresql_with={"m": 16, "ef_construction": 64},
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
    )


class NotePermission(Base):
    __tablename__ = "note_permissions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    note_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("notes.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[str] = mapped_column(String(10), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    note: Mapped["Note"] = relationship("Note", back_populates="permissions")
    user: Mapped["User"] = relationship("User", back_populates="note_permissions")


class Attachment(Base):
    __tablename__ = "attachments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    note_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("notes.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    file_url: Mapped[str] = mapped_column(Text, nullable=False)
    public_id: Mapped[str] = mapped_column(Text, nullable=False)
    filename: Mapped[str] = mapped_column(Text, nullable=False)
    file_type: Mapped[str] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    note: Mapped["Note"] = relationship("Note", back_populates="attachments")
    user: Mapped["User"] = relationship("User", back_populates="attachments")
