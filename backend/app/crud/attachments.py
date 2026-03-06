# backend/app/crud/attachments.py
from sqlalchemy.orm import Session  # ← must be Session, not AsyncSession
from app.models.models import Attachment


def create_attachment(
    db: Session,  # ← Session
    note_id: str,
    user_id: str,
    file_url: str,
    public_id: str,
    filename: str,
    file_type: str,
) -> Attachment:
    attachment = Attachment(
        note_id=note_id,
        user_id=user_id,
        file_url=file_url,
        public_id=public_id,
        filename=filename,
        file_type=file_type,
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return attachment


def get_attachments_for_note(
    db: Session,  # ← Session
    note_id: str,
    user_id: str,
) -> list[Attachment]:
    return (
        db.query(Attachment)
        .filter(Attachment.note_id == note_id, Attachment.user_id == user_id)
        .order_by(Attachment.created_at)
        .all()
    )


def get_attachment_by_id(
    db: Session,  # ← Session
    attachment_id: str,
    user_id: str,
) -> Attachment | None:
    return (
        db.query(Attachment)
        .filter(Attachment.id == attachment_id, Attachment.user_id == user_id)
        .first()
    )


def delete_attachment(
    db: Session,  # ← Session
    attachment_id: str,
    user_id: str,
) -> Attachment | None:
    attachment = get_attachment_by_id(db, attachment_id, user_id)
    if attachment:
        db.delete(attachment)
        db.commit()
    return attachment
