import uuid
import pytest


async def test_register_success(client):
    email = f"reg_{uuid.uuid4().hex[:8]}@test.com"
    resp = await client.post(
        "/auth/register", json={"email": email, "password": "TestPass123!"}
    )
    assert resp.status_code == 201
    assert resp.json()["message"] == "User registered successfully"
    assert "id" in resp.json()


async def test_register_duplicate_email(client):
    email = f"dup_{uuid.uuid4().hex[:8]}@test.com"
    await client.post(
        "/auth/register", json={"email": email, "password": "TestPass123!"}
    )
    resp = await client.post(
        "/auth/register", json={"email": email, "password": "TestPass123!"}
    )
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Email already registered"


async def test_register_short_password(client):
    email = f"short_{uuid.uuid4().hex[:8]}@test.com"
    resp = await client.post(
        "/auth/register", json={"email": email, "password": "short"}
    )
    assert resp.status_code == 422  # Unprocessable Entity due to validation error


async def test_login_success_returns_tokens(client):
    email = f"login_{uuid.uuid4().hex[:8]}@test.com"
    password = "TestPass123!"
    await client.post("/auth/register", json={"email": email, "password": password})
    resp = await client.post("/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200
    json_resp = resp.json()
    assert "access_token" in json_resp
    assert "refresh_token" in json_resp
    assert json_resp["token_type"] == "bearer"


async def test_login_invalid_password(client):
    email = f"invalid_{uuid.uuid4().hex[:8]}@test.com"
    await client.post(
        "/auth/register", json={"email": email, "password": "CorrectPass123!"}
    )
    resp = await client.post(
        "/auth/login", json={"email": email, "password": "WrongPass123!"}
    )
    assert resp.status_code == 401


async def test_refresh_token_returns_new_tokens(client):
    email = f"refresh_{uuid.uuid4().hex[:8]}@test.com"
    password = "TestPass123!"
    await client.post("/auth/register", json={"email": email, "password": password})
    login_resp = await client.post(
        "/auth/login", json={"email": email, "password": password}
    )
    refresh_token = login_resp.json()["refresh_token"]
    refresh_resp = await client.post(
        "/auth/refresh", json={"refresh_token": refresh_token}
    )
    assert refresh_resp.status_code == 200
    assert "access_token" in refresh_resp.json()


async def test_refresh_token_invalid_token(client):
    resp = await client.post("/auth/refresh", json={"refresh_token": "invalidtoken"})
    assert resp.status_code == 401


async def test_logout_success(client):
    email = f"logout_{uuid.uuid4().hex[:8]}@test.com"
    password = "TestPass123!"
    await client.post("/auth/register", json={"email": email, "password": password})
    login_resp = await client.post(
        "/auth/login", json={"email": email, "password": password}
    )
    refresh_token = login_resp.json()["refresh_token"]
    logout_resp = await client.post(
        "/auth/logout", json={"refresh_token": refresh_token}
    )
    assert logout_resp.status_code == 200

    resp2 = await client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert resp2.status_code == 401
