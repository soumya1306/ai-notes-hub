from unittest.mock import patch, MagicMock
import io
import uuid


async def test_upload_attachment_success(client, auth_token, monkeypatch):
    mock_upload = MagicMock(
        return_value={
            "secure_url": "https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg",
            "public_id": "sample_public_id",
        }
    )
    monkeypatch.setattr("cloudinary.uploader.upload", mock_upload)

    note_resp = await client.post(
        "/notes/",
        json={"content": "<p>Note with attachment</p>", "tags": ["attachment"]},
        headers=auth_token,
    )
    note = note_resp.json()
    resp = await client.post(
        f'attachments/notes/{note["id"]}',
        files={"file": ("test.txt", b"Hello World", "text/plain")},
        headers=auth_token,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["public_id"] == "sample_public_id"
    assert "file_url" in data


async def test_list_attachments(client, auth_token):
    upload_returns = [
        {
            "secure_url": "https://res.cloudinary.com/demo/image/upload/v1234567890/doc.pdf",
            "public_id": "sample_public_id_pdf",
        },
        {
            "secure_url": "https://res.cloudinary.com/demo/image/upload/v1234567890/image.png",
            "public_id": "sample_public_id_png",
        },
        {
            "secure_url": "https://res.cloudinary.com/demo/image/upload/v1234567890/notes.txt",
            "public_id": "sample_public_id_txt",
        },
    ]

    with patch("cloudinary.uploader.upload", side_effect=upload_returns):

        note_resp = await client.post(
            "/notes/",
            json={"content": "<p>Note with attachment</p>", "tags": ["attachment"]},
            headers=auth_token,
        )
        note = note_resp.json()

        await client.post(
            f'attachments/notes/{note["id"]}',
            files={"file": ("doc.pdf", io.BytesIO(b"PDF content"), "application/pdf")},
            headers=auth_token,
        )
        await client.post(
            f'attachments/notes/{note["id"]}',
            files={"file": ("image.png", io.BytesIO(b"PNG content"), "image/png")},
            headers=auth_token,
        )
        await client.post(
            f'attachments/notes/{note["id"]}',
            files={"file": ("notes.txt", io.BytesIO(b"Text content"), "text/plain")},
            headers=auth_token,
        )

        list_resp = await client.get(
            f'attachments/notes/{note["id"]}', headers=auth_token
        )
        assert list_resp.status_code == 200
        assert len(list_resp.json()) == 3
        filenames = [att["filename"] for att in list_resp.json()]
        assert "doc.pdf" in filenames
        assert "image.png" in filenames
        assert "notes.txt" in filenames


async def test_delete_attachment(client, auth_token, monkeypatch):
    mock_upload = MagicMock(
        return_value={
            "secure_url": "https://res.cloudinary.com/demo/image/upload/v1234567890/test.txt",
            "public_id": "sample_public_id_delete",
        }
    )
    mock_destroy = MagicMock(return_value={"result": "ok"})
    monkeypatch.setattr("cloudinary.uploader.upload", mock_upload)
    monkeypatch.setattr("cloudinary.uploader.destroy", mock_destroy)

    note_resp = await client.post(
        "/notes/",
        json={"content": "<p>Note with attachment</p>", "tags": ["attachment"]},
        headers=auth_token,
    )
    note = note_resp.json()

    upload_resp = await client.post(
        f'attachments/notes/{note["id"]}',
        files={"file": ("test.txt", io.BytesIO(b"Hello World"), "text/plain")},
        headers=auth_token,
    )
    att_id = upload_resp.json()["id"]

    delete_resp = await client.delete(f"attachments/{att_id}", headers=auth_token)
    assert delete_resp.status_code == 204

    list_resp = await client.get(f'attachments/notes/{note["id"]}', headers=auth_token)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 0


async def test_rejected_file_type(client, auth_token):
    note_resp = await client.post(
        "/notes/",
        json={"content": "<p>Note with attachment</p>", "tags": ["attachment"]},
        headers=auth_token,
    )
    note = note_resp.json()

    resp = await client.post(
        f'attachments/notes/{note["id"]}',
        files={
            "file": (
                "malicious.exe",
                io.BytesIO(b"Executable content"),
                "application/x-msdownload",
            )
        },
        headers=auth_token,
    )
    assert resp.status_code == 415


async def test_upload_to_nonexistent_note(client, auth_token):
    resp = await client.post(
        f"attachments/notes/{uuid.uuid4()}",
        files={"file": ("test.txt", io.BytesIO(b"Hello World"), "text/plain")},
        headers=auth_token,
    )
    assert resp.status_code == 404


async def test_large_file_upload(client, auth_token):
    note_resp = await client.post(
        "/notes/",
        json={"content": "<p>Note with attachment</p>", "tags": ["attachment"]},
        headers=auth_token,
    )
    note = note_resp.json()

    large_content = b"A" * (10 * 1024 * 1024 + 1)  # 10 MB + 1 byte
    resp = await client.post(
        f'attachments/notes/{note["id"]}',
        files={"file": ("large_file.txt", io.BytesIO(large_content), "text/plain")},
        headers=auth_token,
    )
    assert resp.status_code == 413
