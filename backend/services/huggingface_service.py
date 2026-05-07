import os
import asyncio
from huggingface_hub import InferenceClient
from dotenv import load_dotenv

load_dotenv()

HF_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN")


async def transcribe_and_summarize(file_path: str, filename: str) -> dict:
    """
    Use Hugging Face Inference API to transcribe audio then summarize.
    - Transcription: openai/whisper-large-v3
    - Summarization: facebook/bart-large-cnn
    """
    if not HF_API_TOKEN:
        raise ValueError("HUGGINGFACE_API_TOKEN is not set in environment variables.")

    client = InferenceClient(token=HF_API_TOKEN)
    loop = asyncio.get_event_loop()

    # Read audio bytes
    with open(file_path, "rb") as f:
        audio_bytes = f.read()

    # Step 1: Transcription via Whisper
    transcript_result = await loop.run_in_executor(
        None,
        lambda: client.automatic_speech_recognition(
            audio=audio_bytes,
            model="openai/whisper-large-v3",
        ),
    )

    if isinstance(transcript_result, dict):
        transcript = transcript_result.get("text", "").strip()
    else:
        transcript = str(transcript_result).strip()

    if not transcript:
        raise ValueError("Transcription returned empty result.")

    # Step 2: Summarization via BART
    summary_result = await loop.run_in_executor(
        None,
        lambda: client.summarization(
            text=transcript,
            model="facebook/bart-large-cnn",
            parameters={"max_length": 200, "min_length": 60},
        ),
    )

    if isinstance(summary_result, dict):
        summary = summary_result.get("summary_text", "").strip()
    elif hasattr(summary_result, "summary_text"):
        summary = summary_result.summary_text.strip()
    else:
        summary = str(summary_result).strip()

    return {"transcript": transcript, "summary": summary}
