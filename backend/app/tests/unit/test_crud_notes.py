from unittest.mock import AsyncMock, patch
from sqlalchemy.orm import Session

from app.crud import notes as crud
from app.models.models import User
from app.schemas.schemas import NoteCreate

import bcrypt, uuid

from app.tests.conftest import FAKE_EMBEDDING

# Unit tests for CRUD operations and AI service integration


def make_user(db_session, email="owner@test.com") -> User:

    hashed = bcrypt.hashpw(b"pass", bcrypt.gensalt()).decode()
    user = User(id=str(uuid.uuid4()), email=email, hashed_password=hashed)
    db_session.add(user)
    db_session.flush()
    return user


def test_create_note_seeds_owner_permission(db_session):
    user = make_user(db_session)
    note = crud.create_note(
        db_session,
        NoteCreate(content="This is a test note.", tags=["test", "note"]),
        str(user.id),
        FAKE_EMBEDDING,
    )
    assert note.id is not None
    results = crud.get_notes(db_session, str(user.id))
    assert len(results) == 1
    _, role = results[0]
    assert role == "owner"


def test_get_notes_returns_only_user_notes(db_session: Session):
    user1 = make_user(db_session, email="user1@test.com")
    user2 = make_user(db_session, email="user2@test.com")
    crud.create_note(
        db_session,
        NoteCreate(content="User 1's note", tags=["user1"]),
        str(user1.id),
        FAKE_EMBEDDING,
    )
    crud.create_note(
        db_session,
        NoteCreate(content="User 2's note", tags=["user2"]),
        str(user2.id),
        FAKE_EMBEDDING,
    )
    note1 = crud.get_notes(db_session, str(user1.id))
    assert len(note1) == 1
    assert all(role == "owner" for _, role in note1)


def test_delete_note_by_non_owner_fails(db_session: Session):
    owner = make_user(db_session, email="owner2@test.com")
    other = make_user(db_session, email="other@test.com")
    note = crud.create_note(
        db_session,
        NoteCreate(content="<p>Owner's note</p>", tags=["owner"]),
        str(owner.id),
        FAKE_EMBEDDING,
    )
    success, reason = crud.delete_note(db_session, str(note.id), str(other.id))
    assert success is False
    assert reason == "forbidden"
