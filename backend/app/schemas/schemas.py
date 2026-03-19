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
    user_id: uuid.UUID

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


class AttachmentResponse(BaseModel):
    id: uuid.UUID
    note_id: uuid.UUID
    file_url: str
    public_id: str
    filename: str
    file_type: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ShareNoteRequest(BaseModel):
    email: EmailStr
    role: str = Field(default="editor", pattern="^(editor|viewer)$")


class NotePermissionResponse(BaseModel):
    id: uuid.UUID
    note_id: uuid.UUID
    user_id: uuid.UUID
    email: str
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}
