"""
Rollback pattern: Each test gets a real DB connection wrapped in a transaction that rolls back after the test — zero cleanup code needed, zero data leakage between tests.
"""

import pytest
from typing import Generator, AsyncGenerator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from httpx import AsyncClient, ASGITransport

from main import app
from app.models.models import Base
from app.database import get_db

import os

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "")

test_engine = create_engine(TEST_DATABASE_URL)
TestSessionLocal = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)


@pytest.fixture(scope="session", autouse=True)
def create_test_tables():
    """
    First it creates a database, the scope provides the lifespan that is for the whole session.
    then the autouse allows the create_test_tables() to be passed to all other fixtures so need to create them everytime. Once the yield hits it goes and executes other fixtures then at the end it drops the test table it create for this scope.
    """
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    """
    Ideally yield returns Generator[YieldType, SendType, ReturnType], In this case pytest only uses the first one it agains creates a chain like structure like the previous functions, it opens a connection and keeps it open untill the end
    """
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestSessionLocal(bind=connection)
    yield session
    transaction.rollback()
    session.close()
    connection.close()


@pytest.fixture()
def override_db(db_session: Session):
    """
    This is again a part of the chain, it tells the fastAPI to use this fake database instead of the original database for this particular purpose
    """

    def _override():
        yield db_session

    app.dependency_overrides[get_db] = _override
    yield
    app.dependency_overrides.clear()


@pytest.fixture()
async def client(override_db) -> AsyncGenerator[AsyncClient, None]:
    """
    For Async functions yield returns an async generator, it doesnt havea a return type so only 2 parameters, so the return type is AsyncGenerator[YieldType, SendType]
    """

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


@pytest.fixture()
async def auth_headers(client):
    await client.post(
        "auth/register",
        json={"email": "testuser@example.com", "password": "TestPass123!"},
    )
    resp = await client.post(
        "auth/login", json={"email": "testuser@example.com", "password": "TestPass123!"}
    )
    token = resp.json()["access_token"]

    yield {"Authorization": f"Bearer {token}"}
