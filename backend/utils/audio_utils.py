import os
import mimetypes
import tempfile
import aiofiles
from pathlib import Path

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a", ".ogg", ".webm"}
ALLOWED_MIME_TYPES = {
    "audio/mpeg",
    "audio/wav",
    "audio/x-wav",
    "audio/mp4",
    "audio/x-m4a",
    "audio/ogg",
    "audio/webm",
    "video/webm",  # webm can report as video
    "application/octet-stream",  # fallback for some browsers
}


def validate_file_extension(filename: str) -> bool:
    """Check that the uploaded file has an allowed extension."""
    suffix = Path(filename).suffix.lower()
    return suffix in ALLOWED_EXTENSIONS


def validate_file_size(size_bytes: int, max_mb: float = 25.0) -> bool:
    """Check that the file size is within the allowed limit."""
    max_bytes = max_mb * 1024 * 1024
    return size_bytes <= max_bytes


async def save_temp_file(file_bytes: bytes, suffix: str) -> str:
    """Save bytes to a temporary file and return its path."""
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp_path = tmp.name

    async with aiofiles.open(tmp_path, "wb") as f:
        await f.write(file_bytes)

    return tmp_path


def cleanup_temp_file(path: str) -> None:
    """Remove a temporary file if it exists."""
    try:
        if os.path.exists(path):
            os.remove(path)
    except Exception:
        pass  # Best-effort cleanup
