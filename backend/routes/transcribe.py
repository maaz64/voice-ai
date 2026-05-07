import os
import time
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from models.schemas import TranscribeResponse
from utils.audio_utils import (
    validate_file_extension,
    validate_file_size,
    save_temp_file,
    cleanup_temp_file,
)
from services import gemini_service, huggingface_service

load_dotenv()

router = APIRouter()

MAX_FILE_SIZE_MB = float(os.getenv("MAX_FILE_SIZE_MB", "25"))


@router.post("/api/transcribe", response_model=TranscribeResponse)
async def transcribe(
    file: UploadFile = File(...),
    provider: str = Form(default="gemini"),
):
    # --- Validate file extension ---
    if not validate_file_extension(file.filename or ""):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: .mp3, .wav, .m4a, .ogg, .webm",
        )

    # --- Read file bytes ---
    file_bytes = await file.read()

    # --- Validate file size ---
    if not validate_file_size(len(file_bytes), MAX_FILE_SIZE_MB):
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum allowed size is {int(MAX_FILE_SIZE_MB)}MB.",
        )

    # --- Save to temp file ---
    suffix = Path(file.filename or "audio.webm").suffix.lower()
    tmp_path = await save_temp_file(file_bytes, suffix)

    start_time = time.time()

    try:
        provider = provider.lower().strip()

        if provider == "gemini":
            result = await gemini_service.transcribe_and_summarize(
                tmp_path, file.filename or "audio" + suffix
            )
        elif provider == "huggingface":
            result = await huggingface_service.transcribe_and_summarize(
                tmp_path, file.filename or "audio" + suffix
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown provider '{provider}'. Use 'gemini' or 'huggingface'.",
            )

        duration = round(time.time() - start_time, 2)

        return TranscribeResponse(
            transcript=result["transcript"],
            summary=result["summary"],
            duration_seconds=duration,
            provider_used=provider,
        )

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except TimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
    finally:
        cleanup_temp_file(tmp_path)
