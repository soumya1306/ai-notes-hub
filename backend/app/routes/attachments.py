import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.auth import get_current_user_id
from app.schemas.schemas import AttachmentResponse
import app.crud.attachments as attachment_crud
import app.crud.notes as notes_crud
from app.services.cloudinary import (
    upload_file_to_cloudinary,
    delete_file_from_cloudinary,
)

router = APIRouter(prefix="/attachments", tags=["Attachments"])


@router.post("/notes/{note_id}", response_model=AttachmentResponse, status_code=201)
async def upload_attachment(
    note_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    note = notes_crud.get_note_by_id(db, note_id, user_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found.")

    upload_result = await upload_file_to_cloudinary(file, user_id)

    attachment = attachment_crud.create_attachment(
        db=db,
        note_id=note_id,
        user_id=user_id,
        file_url=upload_result["file_url"],
        public_id=upload_result["public_id"],
        filename=upload_result["filename"],
        file_type=upload_result["file_type"],
    )
    return attachment


@router.get("/notes/{note_id}", response_model=list[AttachmentResponse])
async def list_attachments(
    note_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    note = notes_crud.get_note_by_id(db, note_id, user_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found.")
    return attachment_crud.get_attachments_for_note(db, note_id, user_id)


@router.delete("/{attachment_id}", status_code=204)
async def delete_attachment(
    attachment_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    attachment = attachment_crud.get_attachment_by_id(db, attachment_id, user_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found.")

    await delete_file_from_cloudinary(attachment.public_id, attachment.file_type)
    attachment_crud.delete_attachment(db, attachment_id, user_id)
