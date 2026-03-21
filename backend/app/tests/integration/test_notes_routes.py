# Integration tests (via HTTP client)
from unittest.mock import AsyncMock


async def test_create_get_note(client, auth_token):
    resp = await client.post(
        "/notes/",
        json={"content": "<p>Test note content</p>", "tags": ["test", "note"]},
        headers=auth_token,
    )
    assert resp.status_code == 201
    note_id = resp.json()["id"]

    get_resp = await client.get(f"/notes/", headers=auth_token)
    assert get_resp.status_code == 200
    ids = [n["id"] for n in get_resp.json()]
    assert note_id in ids


async def test_update_note(client, auth_token):
    # Create a note
    note = await client.post(
        "/notes/",
        json={"content": "<p>Original content</p>", "tags": ["original"]},
        headers=auth_token,
    )
    assert note.status_code == 201
    note_id = note.json()["id"]

    # Update the note
    update_resp = await client.put(
        f"/notes/{note_id}",
        json={"content": "<p>Updated content</p>", "tags": ["updated"]},
        headers=auth_token,
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["content"] == "<p>Updated content</p>"
    assert update_resp.json()["tags"] == ["updated"]


async def test_delete_note(client, auth_token):
    # Create a note
    note = await client.post(
        "/notes/",
        json={"content": "<p>Note to delete</p>", "tags": ["delete"]},
        headers=auth_token,
    )
    assert note.status_code == 201
    note_id = note.json()["id"]

    # Delete the note
    delete_resp = await client.delete(f"/notes/{note_id}", headers=auth_token)
    assert delete_resp.status_code == 204

    # Try to get the deleted note
    get_resp = await client.get(f"/notes/", headers=auth_token)
    assert get_resp.status_code == 200
    ids = [n["id"] for n in get_resp.json()]
    assert note_id not in ids


async def test_search_notes(client, auth_token):
    # Create notes
    await client.post(
        "/notes/",
        json={"content": "<p>Python testing note</p>", "tags": ["python", "testing"]},
        headers=auth_token,
    )
    await client.post(
        "/notes/",
        json={"content": "<p>FastAPI note</p>", "tags": ["fastapi"]},
        headers=auth_token,
    )

    # Search for notes with "python"
    search_resp = await client.get("/notes/?search=python", headers=auth_token)
    assert search_resp.status_code == 200
    results = search_resp.json()
    assert len(results) == 1
    assert results[0]["content"] == "<p>Python testing note</p>"


async def test_unauthorized_returns_401(client):
    resp = await client.get("/notes/")
    assert resp.status_code == 401


async def test_summarize_note(client, auth_token, monkeypatch):
    import app.services.ai as ai_service

    monkeypatch.setattr(
        ai_service, "summarize_note", AsyncMock(return_value="This is a summary.")
    )

    note_resp = await client.post(
        "/notes/",
        json={"content": "<p>Note to summarize</p>", "tags": ["summarize"]},
        headers=auth_token,
    )
    note = note_resp.json()

    resp = await client.post(f"/notes/{note['id']}/summarize", headers=auth_token)
    assert resp.status_code == 200
