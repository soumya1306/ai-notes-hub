"""
  This code is pretty self explanatory, we are creating a model for the table that will be created. Defining the columns and its constraints.
"""

import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import String, ARRAY, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from database import Base

class Note(Base):
    __tablename__ = "notes"

    # Mapped[type] tells Python the exact type (str, uuid, etc.)
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content: Mapped[str] = mapped_column(String(500), nullable=False)
    tags: Mapped[List[str]] = mapped_column(ARRAY(String), default=list)
    
    # Use server_default or a callable (no parens) for timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)