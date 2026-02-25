from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware

from typing import List

from sqlalchemy.orm import Session
from database import get_db, engine, Base
from models import Note

from schemas import NoteCreate, NoteResponse
import crud

from dotenv import load_dotenv


load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Notes Hub", version="2.0.0")

app.add_middleware(
  CORSMiddleware,
  allow_origins=["http://localhost:5173"],
  allow_credentials = True,
  allow_methods= ["*"],
  allow_headers=["*"]
)

  
@app.get("/")
async def root():
  return {"status": "ok", "message": "AI Notes Hub v2.0.0 is running!"}

#create note
@app.post("/notes/", response_model=NoteResponse, status_code=201)
async def create_note(note: NoteCreate, db: Session = Depends(get_db)):
  new_note = crud.create_note(db, note)
  return new_note

#get all notes
@app.get("/notes/", response_model=List[NoteResponse], status_code=200)
async def get_notes(db: Session = Depends(get_db)):
  return crud.get_notes(db)

#update note
@app.put("/notes/{note_id}", response_model=NoteResponse, status_code=200)
async def update_note(note_id: str, note: NoteCreate, db: Session = Depends(get_db)):
  updated_note = crud.update_note(db, note_id, note)
  if not updated_note:
    raise HTTPException(status_code=404, detail="Note not found")
  return updated_note

@app.delete("/notes/{note_id}", status_code=204)
async def delete_note(note_id: str, db: Session = Depends(get_db)):
  deleted = crud.delete_note(db, note_id)
  if not deleted:
    raise HTTPException(status_code=404, detail="Note not found")