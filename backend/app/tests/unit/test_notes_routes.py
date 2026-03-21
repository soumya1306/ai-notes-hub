import pytest
from app.crud import notes as crud
from app.schemas.schemas import NoteCreate
from unittest.mock import patch

FAKE_EMBEDDING = [0.1] * 768


def make_user(db_session, email="owner@test.com"):
    from app.models.models import User
    import bcrypt, uuid

    hashed = bcrypt.hashpw(b"pass", bcrypt.gensalt()).decode()
    user = User(id=str(uuid.uuid4()), email=email, hashed_password=hashed)
    db_session.add(user)
    db_session.flush()
    return user
