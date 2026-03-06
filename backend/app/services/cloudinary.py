import os
import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    source=True,
)

ALLOWED_TYPES: set[str] = {
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "video/mp4",
    "video/quicktime",
}

MAX_FILE_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB


async def upload_file_to_cloudinary(file: UploadFile, user_id: str) -> dict:
    """
    Validates and uploads a file to Cloudinary
    Returns dict with: file_url, public_id, filename, file_type.
    """

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {file.content_type}. Allowed: images, PDF, plain text, MP4/MOV.",
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds 10 MB limit.")

    # Determine resource type for Cloudinary
    if file.content_type.startswith("image/"):
        resource_type = "image"
    elif file.content_type.startswith("video/"):
        resource_type = "video"
    else:
        resource_type = "raw"

    try:
        result: dict = cloudinary.uploader.upload(
            contents,
            resource_type=resource_type,
            folder=f"ai-notes-hub/{user_id}",
            use_filename=True,
            unique_filename=True,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502, detail=f"Cloudinary upload failed:{exc}"
        ) from exc

    return {
        "file_url": result["secure_url"],
        "public_id": result["public_id"],
        "filename": file.filename or result["public_id"].split("/")[-1],
        "file_type": file.content_type,
    }


async def delete_file_from_cloudinary(public_id: str, file_type: str) -> None:
    """
    Deleted a file from Cloudinary by its public_id.
    """
    if file_type.startswith("image/"):
        resource_type = "image"
    elif file_type.startswith("video/"):
        resource_type = "video"
    else:
        resource_type = "raw"

    try:
        cloudinary.uploader.destroy(public_id, resource_type=resource_type)
    except Exception as exc:
        print(f"[cloudinary] destroy failed for {public_id}: {exc}")
