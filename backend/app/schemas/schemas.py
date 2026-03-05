from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime
import uuid


class NoteCreate(BaseModel):
    content: str = Field(..., min_length=1)
    tags: List[str] = Field(default_factory=list)


class NoteResponse(BaseModel):
    id: uuid.UUID
    content: str
    tags: List[str]
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class SummarizeResponse(BaseModel):
    summary: str


class AutoTagsResponse(BaseModel):
    tags: List[str]


class SemanticSearchResult(BaseModel):
    note: NoteResponse
    score: float


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000)


class AskResponse(BaseModel):
    answer: str
    source_note_ids: List[uuid.UUID]
