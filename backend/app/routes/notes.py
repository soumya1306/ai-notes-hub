from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.schemas import (
    NoteCreate,
    NoteResponse,
    SummarizeResponse,
    AutoTagsResponse,
)
from app.core.auth import get_current_user_id
import app.crud.notes as crud
from app.services.ai import summarize_note, generate_tags

router = APIRouter(prefix="/notes", tags=["Notes"])


# create note
@router.post("/", response_model=NoteResponse, status_code=201)
async def create_note(
    note: NoteCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    new_note = crud.create_note(db, note, user_id)
    return new_note


# get all notes
@router.get("/", response_model=List[NoteResponse], status_code=200)
async def get_notes(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
    search: str | None = Query(default=None, max_length=100),
):
    return crud.get_notes(db, user_id, search=search)


# update note
@router.put("/{note_id}", response_model=NoteResponse, status_code=200)
async def update_note(
    note_id: str,
    note: NoteCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    updated_note = crud.update_note(db, note_id, note, user_id)
    if not updated_note:
        raise HTTPException(status_code=404, detail="Note not found")
    return updated_note


# delete note
@router.delete("/{note_id}", status_code=204)
async def delete_note(
    note_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    deleted = crud.delete_note(db, note_id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Note not found")


# summaraize a note
@router.post("/{note_id}/summarize", response_model=SummarizeResponse, status_code=200)
async def summarize(
    note_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    note = crud.get_note_by_id(db, note_id, user_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    summary = await summarize_note(note.content)
    return SummarizeResponse(summary=summary)


# create tags automatically
@router.post("/{note_id}/autotags", response_model=AutoTagsResponse, status_code=200)
async def autotags(
    note_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    note = crud.get_note_by_id(db, note_id, user_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    tags = await generate_tags(note.content)
    return AutoTagsResponse(tags=tags)
