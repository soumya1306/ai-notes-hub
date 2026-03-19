from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from pgvector.sqlalchemy import Vector
from app.models.models import Note, NotePermission, User
from app.schemas.schemas import NoteCreate, NotePermissionResponse
from datetime import datetime, timezone

#  Helper Functions  #


def _has_access(db: Session, note_id: str, user_id: str) -> bool:
    """
    True if user is owner, editor or viewer of the note
    """
    return (
        db.query(NotePermission)
        .filter(
            NotePermission.note_id == note_id,
            NotePermission.user_id == user_id,
        )
        .first()
        is not None
    )


def _is_owner(db: Session, note_id: str, user_id: str) -> bool:
    """
    True only if user has the owner role.
    """
    return (
        db.query(NotePermission)
        .filter(
            NotePermission.note_id == note_id,
            NotePermission.user_id == user_id,
            NotePermission.role == "owner",
        )
        .first()
        is not None
    )


#  CRUD  #


def get_notes(db: Session, user_id: str, search: str | None = None) -> list[Note]:
    query = (
        db.query(Note)
        .join(NotePermission, NotePermission.note_id == Note.id)
        .filter(NotePermission.user_id == user_id)
    )
    if search:
        term = f"%{search.lower()}%"
        tags_as_str = func.array_to_string(Note.tags, " ")
        query = query.filter(Note.content.ilike(term) | tags_as_str.ilike(term))
    return query.distinct().order_by(Note.created_at.desc()).all()


def get_note_by_id(db: Session, note_id: str, user_id: str) -> Note | None:
    if not _has_access(db, note_id, user_id):
        return None
    return db.query(Note).filter(Note.id == note_id).first()


def create_note(
    db: Session, note: NoteCreate, user_id: str, embedding: list[float] | None
) -> Note:
    db_note = Note(
        content=note.content, tags=note.tags, user_id=user_id, embedding=embedding
    )

    db.add(db_note)
    db.flush()

    permission = NotePermission(
        note_id=db_note.id,
        user_id=user_id,
        role="owner",
    )
    db.add(permission)

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
    perm = (
        db.query(NotePermission)
        .filter(
            NotePermission.note_id == note_id,
            NotePermission.user_id == user_id,
            NotePermission.role.in_(["owner", "editor"]),
        )
        .first()
    )

    if not perm:
        return None

    db_note = db.query(Note).filter(Note.id == note_id).first()

    if db_note:
        db_note.content = note.content
        db_note.tags = note.tags
        db_note.updated_at = datetime.now(timezone.utc)
        if embedding is not None:
            db_note.embedding = embedding
        db.commit()
        db.refresh(db_note)
    return db_note


def delete_note(db: Session, note_id: str, user_id: str) -> tuple[bool, str]:

    db_note = db.query(Note).filter(Note.id == note_id).first()
    if not db_note:
        return False, "not_found"
    if not _is_owner(db, note_id, user_id):
        return False, "forbidden"

    db.delete(db_note)
    db.commit()
    return True, "ok"


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
        .join(NotePermission, NotePermission.note_id == Note.id)
        .filter(Note.user_id == user_id, Note.embedding.is_not(None))
        .order_by(Note.embedding.cosine_distance(query_embedding))
        .limit(limit)
        .all()
    )
    return [row for row in results if row.score >= min_score]


# Sharing #


def share_note(
    db: Session, note_id: str, owner_id: str, email: str, role: str
) -> NotePermission | None:
    """
    Only owner can share. None if not owner or user not found.
    """

    if not _is_owner(db, note_id, owner_id):
        return None

    target_user = db.query(User).filter(User.email == email).first()
    if not target_user:
        return None

    # Prevent the owner from downgrading their own role
    if str(target_user.id) == owner_id:
        return None

    # upsert- update role if already shared
    existing = (
        db.query(NotePermission)
        .filter(
            NotePermission.note_id == note_id,
            NotePermission.user_id == target_user.id,
        )
        .first()
    )

    if existing:
        existing.role = role
        db.commit()
        db.refresh(existing)
        return existing

    perm = NotePermission(note_id=note_id, user_id=target_user.id, role=role)
    db.add(perm)
    db.commit()
    db.refresh(perm)
    return perm


def revoke_share(db: Session, note_id: str, owner_id: str, target_user_id: str) -> bool:
    """
    Only owner can revoke. Cannot revoke owner's own permission.
    """

    if not _is_owner(db, note_id, owner_id):
        return False
    perm = (
        db.query(NotePermission)
        .filter(
            NotePermission.note_id == note_id,
            NotePermission.user_id == target_user_id,
            NotePermission.role != "owner",
        )
        .first()
    )

    if not perm:
        return False

    db.delete(perm)
    db.commit()
    return True


def get_note_collaborators(db: Session, note_id: str, user_id: str) -> list[NotePermissionResponse] | None:
    """
    Returns all collaborators for a note. Requires access.
    """

    if not _has_access(db, note_id, user_id):
        return None

    perms = (
        db.query(NotePermission)
        .options(joinedload(NotePermission.user))
        .filter(NotePermission.note_id == note_id)
        .all()
    )

    return [
        NotePermissionResponse.model_validate(
            {
                "id": perm.id,
                "note_id": perm.note_id,
                "user_id": perm.user_id,
                "email": perm.user.email,
                "role": perm.role,
                "created_at": perm.created_at,
            }
        )
        for perm in perms
    ]
