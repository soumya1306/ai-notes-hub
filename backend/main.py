from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware

from typing import List

from sqlalchemy.orm import Session
from database import get_db, engine, Base
from models import Note

from schemas import NoteCreate, NoteResponse

import crud
from auth_routes import router as auth_router
from auth import get_current_user_id

from dotenv import load_dotenv


load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Notes Hub", version="3.0.0")

app.add_middleware(
  CORSMiddleware,
  allow_origins=["http://localhost:5173"],
  allow_credentials = True,
  allow_methods= ["*"],
  allow_headers=["*"]
)

app.include_router(auth_router)
  
@app.get("/")
async def root():
  return {"status": "ok", "message": "AI Notes Hub v3.0.0 is running!"}

#create note
@app.post("/notes/", response_model=NoteResponse, status_code=201)
async def create_note(note: NoteCreate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
  new_note = crud.create_note(db, note, user_id)
  return new_note

#get all notes
@app.get("/notes/", response_model=List[NoteResponse], status_code=200)
async def get_notes(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
  return crud.get_notes(db, user_id)

#update note
@app.put("/notes/{note_id}", response_model=NoteResponse, status_code=200)
async def update_note(note_id: str, note: NoteCreate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
  updated_note = crud.update_note(db, note_id, note, user_id)
  if not updated_note:
    raise HTTPException(status_code=404, detail="Note not found")
  return updated_note

@app.delete("/notes/{note_id}", status_code=204)
async def delete_note(note_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
  deleted = crud.delete_note(db, note_id, user_id)
  if not deleted:
    raise HTTPException(status_code=404, detail="Note not found")