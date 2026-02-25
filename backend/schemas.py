from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

class NoteCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)
    tags: List[str] = Field(default_factory=list)

class NoteResponse(BaseModel):
    id: uuid.UUID
    content: str
    tags: List[str]
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
