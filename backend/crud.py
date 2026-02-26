from sqlalchemy.orm import Session
from models import Note
from schemas import NoteCreate
from datetime import datetime, timezone

def get_notes(db: Session, user_id: str):
    return db.query(Note).filter(Note.user_id == user_id).order_by(Note.created_at.desc()).all()

def create_note(db: Session, note: NoteCreate, user_id: str):
    db_note = Note(
        content=note.content,
        tags=note.tags,
        user_id=user_id
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

def update_note(db: Session, note_id: str, note: NoteCreate, user_id: str):
    db_note = db.query(Note).filter(Note.id == note_id, Note.user_id == user_id).first()
    if db_note:
        db_note.content = note.content
        db_note.tags = note.tags
        db_note.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(db_note)
    return db_note

def delete_note(db: Session, note_id: str, user_id: str):
    db_note = db.query(Note).filter(Note.id == note_id, Note.user_id == user_id).first()
    if db_note:
        db.delete(db_note)
        db.commit()
    return db_note
