from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
import uuid

app = FastAPI(title="AI Notes Hub", version="1.0.0")

app.add_middleware(
  CORSMiddleware,
  allow_origins=["http://localhost:5173"],
  allow_credentials = True,
  allow_methods= ["*"],
  allow_headers=["*"]
)

notes_db = []

class NoteCreate(BaseModel):
  content: str = Field(..., min_length =1, max_length=500, strict=True, title="content", description="contents of a note" )
  tags: List[str] = Field(default_factory=list)
  
class NoteResponse(BaseModel):
  id:str
  content: str
  tags: List[str]
  created_at: datetime
  updated_at: Optional[datetime] = None
  
  model_config = {"from_attributes": True}
  
@app.get("/")
async def root():
  return {"status": "ok", "message": "AI Notes Hub Backend Running"}

#create note
@app.post("/notes/", response_model=NoteResponse, status_code=201)
async def create_note(note: NoteCreate):
  new_note = {
    "id": str(uuid.uuid4()),
    "content": note.content,
    "tags": note.tags,
    "created_at": datetime.now(timezone.utc),
    "updated_at": None
  }
  notes_db.append(new_note)
  return new_note

#get all notes
@app.get("/notes/", response_model=List[NoteResponse], status_code=200)
async def get_notes():
  return sorted(notes_db, key=lambda x: x["created_at"], reverse=True)

#update note
@app.put("/notes/{note_id}", response_model=NoteResponse, status_code=200)
async def update_note(note_id: str, note: NoteCreate):
  for i, n in enumerate(notes_db):
    if n["id"] == note_id:
      notes_db[i] = {
        **n,
        "content": note.content,
        "tags": note.tags,
        "updated_at": datetime.now(timezone.utc)
      }
      return notes_db[i]
  raise HTTPException(status_code=404, detail="Note not found")

@app.delete("/notes/{note_id}", status_code=204)
async def delete_note(note_id: str):
  for i, note in enumerate(notes_db):
    if note["id"] == note_id:
      notes_db.pop(i)
      return
  raise HTTPException(status_code=404, detail="Note not found")