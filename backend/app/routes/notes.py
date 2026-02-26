from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.schemas import NoteCreate, NoteResponse
from app.core.auth import get_current_user_id
import app.crud.notes as crud

router = APIRouter(prefix="/notes", tags=["Notes"])

@router.get("/")
async def root():
  return {"status": "ok", "message": "AI Notes Hub v3.0.0 is running!"}

#create note
@router.post("/", response_model=NoteResponse, status_code=201)
async def create_note(note: NoteCreate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
  new_note = crud.create_note(db, note, user_id)
  return new_note

#get all notes
@router.get("/", response_model=List[NoteResponse], status_code=200)
async def get_notes(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
  return crud.get_notes(db, user_id)

#update note
@router.put("/{note_id}", response_model=NoteResponse, status_code=200)
async def update_note(note_id: str, note: NoteCreate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
  updated_note = crud.update_note(db, note_id, note, user_id)
  if not updated_note:
    raise HTTPException(status_code=404, detail="Note not found")
  return updated_note

@router.delete("/{note_id}", status_code=204)
async def delete_note(note_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
  deleted = crud.delete_note(db, note_id, user_id)
  if not deleted:
    raise HTTPException(status_code=404, detail="Note not found")