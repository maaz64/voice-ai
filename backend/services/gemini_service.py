import os
import asyncio
from pathlib import Path
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


async def transcribe_and_summarize(file_path: str, filename: str) -> dict:
    """
    Upload audio to Gemini, transcribe it, then summarize the transcript.
    Returns dict with transcript, summary.
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set in environment variables.")

    suffix = Path(filename).suffix.lower()
    mime_map = {
        ".mp3": "audio/mp3",
        ".mpga": "audio/mpga",
        ".mpeg": "audio/mpeg",
        ".wav": "audio/wav",
        ".m4a": "audio/m4a",
        ".mp4": "audio/mp4",
        ".ogg": "audio/ogg",
        ".webm": "audio/webm",
        ".flac": "audio/flac",
        ".aac": "audio/aac",
        ".aiff": "audio/aiff",
        ".opus": "audio/opus",
        ".pcm": "audio/pcm",
    }
    mime_type = mime_map.get(suffix)
    if mime_type is None:
        supported = ", ".join(sorted(mime_map.keys()))
        raise ValueError(
            f"Unsupported audio format '{suffix}'. Supported formats: {supported}"
        )

    # Run blocking SDK calls in a thread pool to keep FastAPI async
    loop = asyncio.get_event_loop()

    # Upload the audio file
    uploaded_file = await loop.run_in_executor(
        None,
        lambda: genai.upload_file(path=file_path, mime_type=mime_type),
    )

    # Wait for file to be processed
    import time
    for _ in range(30):
        file_status = await loop.run_in_executor(
            None, lambda: genai.get_file(uploaded_file.name)
        )
        if file_status.state.name == "ACTIVE":
            break
        await asyncio.sleep(2)
    else:
        raise TimeoutError("Gemini file processing timed out.")

    model = genai.GenerativeModel("gemini-2.5-flash-lite")

    # Step 1: Transcription
    transcription_prompt = (
        "Transcribe this audio exactly word for word. "
        "Return only the transcript text, no labels or formatting."
    )
    transcript_response = await loop.run_in_executor(
        None,
        lambda: model.generate_content([transcription_prompt, file_status]),
    )
    transcript = transcript_response.text.strip()

    # Step 2: Summarization
    summary_prompt = (
        f"Summarize the following transcript in 3-5 clear sentences capturing the main points:\n\n{transcript}"
    )
    summary_response = await loop.run_in_executor(
        None,
        lambda: model.generate_content(summary_prompt),
    )
    summary = summary_response.text.strip()

    # Clean up uploaded file from Gemini
    try:
        await loop.run_in_executor(None, lambda: genai.delete_file(uploaded_file.name))
    except Exception:
        pass

    return {"transcript": transcript, "summary": summary}
