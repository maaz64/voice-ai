from pydantic import BaseModel
from typing import Literal, Optional


class TranscribeResponse(BaseModel):
    transcript: str
    summary: str
    duration_seconds: float
    provider_used: str


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
