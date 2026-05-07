import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routes.transcribe import router as transcribe_router

load_dotenv()

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app = FastAPI(
    title="VoiceScribe AI",
    description="Audio Transcription & Summarization API powered by Gemini and HuggingFace",
    version="1.0.0",
)

# CORS middleware — allow frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(transcribe_router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "VoiceScribe AI"}
