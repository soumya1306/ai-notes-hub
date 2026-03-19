from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.schemas import (
    NoteCreate,
    NoteResponse,
    SummarizeResponse,
    AutoTagsResponse,
    SemanticSearchResult,
    AskRequest,
    AskResponse,
    NotePermissionResponse,
    ShareNoteRequest,
)
from app.core.auth import get_current_user_id
import app.crud.notes as crud
from app.services.ai import (
    summarize_note,
    generate_tags,
    embed_text,
    ask_question,
    _strip_html,
)

from app.services.ws import manager

router = APIRouter(prefix="/notes", tags=["Notes"])


# create note
@router.post("/", response_model=NoteResponse, status_code=201)
async def create_note(
    note: NoteCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    embedding: list[float] | None = None
    try:
        embedding = await embed_text(note.content)
    except Exception:
        pass

    new_note = crud.create_note(db, note, user_id, embedding)
    return new_note


# get all notes
@router.get("/", response_model=List[NoteResponse], status_code=200)
async def get_notes(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
    search: str | None = Query(default=None, max_length=100),
):
    return crud.get_notes(db, user_id, search=search)


# semantic search
@router.get("/semantic", response_model=List[SemanticSearchResult], status_code=200)
async def semantic_search(
    q: str = Query(..., min_length=1, max_length=500),
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    query_embedding = await embed_text(q)
    results = crud.semantic_search(db, user_id, query_embedding, limit=limit)
    return [
        SemanticSearchResult(
            note=NoteResponse.model_validate(note), score=round(score, 4)
        )
        for note, score in results
    ]


# ask a question
@router.post("/ask", response_model=AskResponse, status_code=200)
async def ask(
    body: AskRequest,
    top_k: int = Query(default=5, ge=1, le=20),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    query_embedding = await embed_text(body.question)
    rows = crud.semantic_search(db, user_id, query_embedding, limit=top_k)

    context_notes: list[str] = []
    source_ids: list = []

    for note, _score in rows:
        context_notes.append(_strip_html(note.content))
        source_ids.append(note.id)

    answer = await ask_question(body.question, context_notes)
    return AskResponse(answer=answer, source_note_ids=source_ids)


# update note
@router.put("/{note_id}", response_model=NoteResponse, status_code=200)
async def update_note(
    note_id: str,
    note: NoteCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    embedding: list[float] | None = None
    try:
        embedding = await embed_text(note.content)
    except Exception:
        pass

    updated_note = crud.update_note(db, note_id, note, user_id, embedding)

    if not updated_note:
        raise HTTPException(
            status_code=404, detail="Note not found or insufficient permissions"
        )

    await manager.broadcast(
        note_id,
        {
            "type": "note_updated",
            "note_id": note_id,
            "content": updated_note.content,
            "tags": updated_note.tags,
            "updated_by": user_id,
        },
        exclude_user=user_id,
    )
    return updated_note


# delete note
@router.delete("/{note_id}", status_code=204)
async def delete_note(
    note_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    success, reason = crud.delete_note(db, note_id, user_id)
    if reason == "not_found":
        raise HTTPException(status_code=404, detail="Note not found")
    if reason == "forbidden":
        raise HTTPException(status_code=403, detail="Only the owner can delete it")

    await manager.broadcast(
        note_id,
        {"type": "note_deleted", "note_id": note_id, "deleted_by": user_id},
        exclude_user=user_id,
    )

    await manager.close_room(note_id)


# summarize a note
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


@router.post("/{note_id}/share", response_model=NotePermissionResponse, status_code=201)
async def share_note(
    note_id: str,
    body: ShareNoteRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    perm = crud.share_note(db, note_id, user_id, body.email, body.role)

    if not perm:
        raise HTTPException(
            status_code=404,
            detail="Note not found, user not found or you are not the owner",
        )
    return perm


@router.delete("/{note_id}/share/{target_user_id}", status_code=204)
async def revoke_share(
    note_id: str,
    target_user_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    success = crud.revoke_share(db, note_id, user_id, target_user_id)

    if not success:
        raise HTTPException(
            status_code=403,
            detail="Note not found, target user not found, you are not the owner or you are trying to revoke owner's permission",
        )


@router.get(
    "/{note_id}/collaborators",
    response_model=List[NotePermissionResponse],
    status_code=200,
)
async def get_collaborators(
    note_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    collaborators = crud.get_note_collaborators(db, note_id, user_id)
    if collaborators is None:
        raise HTTPException(
            status_code=404, detail="Note not found or insufficient permissions"
        )
    return collaborators
