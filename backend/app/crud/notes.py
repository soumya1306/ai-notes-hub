from sqlalchemy.orm import Session
from sqlalchemy import func
from pgvector.sqlalchemy import Vector
from app.models.models import Note
from app.schemas.schemas import NoteCreate
from datetime import datetime, timezone


def get_notes(db: Session, user_id: str, search: str | None = None) -> list[Note]:
    query = db.query(Note).filter(Note.user_id == user_id)
    if search:
        term = f"%{search.lower()}%"
        tags_as_str = func.array_to_string(Note.tags, " ")
        query = query.filter(Note.content.ilike(term) | tags_as_str.ilike(term))
    return query.order_by(Note.created_at.desc()).all()


def get_note_by_id(db: Session, note_id: str, user_id: str) -> Note | None:
    return db.query(Note).filter(Note.id == note_id, Note.user_id == user_id).first()


def create_note(
    db: Session, note: NoteCreate, user_id: str, embedding: list[float] | None
) -> Note:
    db_note = Note(
        content=note.content, tags=note.tags, user_id=user_id, embedding=embedding
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note


def update_note(
    db: Session,
    note_id: str,
    note: NoteCreate,
    user_id: str,
    embedding: list[float] | None,
) -> Note | None:
    db_note = db.query(Note).filter(Note.id == note_id, Note.user_id == user_id).first()
    if db_note:
        db_note.content = note.content
        db_note.tags = note.tags
        db_note.updated_at = datetime.now(timezone.utc)
        if embedding is not None:
            db_note.embedding = embedding
        db.commit()
        db.refresh(db_note)
    return db_note


def delete_note(db: Session, note_id: str, user_id: str) -> Note | None:
    db_note = db.query(Note).filter(Note.id == note_id, Note.user_id == user_id).first()
    if db_note:
        db.delete(db_note)
        db.commit()
    return db_note


def semantic_search(
    db: Session,
    user_id: str,
    query_embedding: list[float],
    limit: int = 10,
    min_score: float = 0.6,
) -> list[tuple[Note, float]]:
    results = (
        db.query(
            Note,
            (1 - Note.embedding.cosine_distance(query_embedding)).label("score"),
        )
        .filter(Note.user_id == user_id, Note.embedding.is_not(None))
        .order_by(Note.embedding.cosine_distance(query_embedding))
        .limit(limit)
        .all()
    )
    return [row for row in results if row.score >= min_score]
