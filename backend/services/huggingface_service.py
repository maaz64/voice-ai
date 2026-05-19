import os
import asyncio
import io
import logging
from pathlib import Path
from typing import NamedTuple

import av
import requests
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

# ── Logging ───────────────────────────────────────────────────────────────────
logger = logging.getLogger(__name__)

# ── Environment ───────────────────────────────────────────────────────────────
load_dotenv()

HF_API_TOKEN: str | None = os.getenv("HUGGINGFACE_API_TOKEN")

# ── Constants ─────────────────────────────────────────────────────────────────
TRANSCRIPTION_URL = (
    "https://router.huggingface.co/hf-inference/models/"
    "openai/whisper-large-v3-turbo"
)
SUMMARIZATION_MODEL = "facebook/bart-large-cnn"

WHISPER_SAMPLE_RATE = 16_000   # Hz — Whisper's native rate; keeps upload small
REQUEST_TIMEOUT     = 120      # seconds
BART_INPUT_LIMIT    = 3_000    # chars — safe ceiling for BART's 1024-token window

# Formats libsndfile (HF server-side) parses natively — send as-is
_NATIVE_FORMATS: frozenset[str] = frozenset({
    ".wav", ".flac", ".ogg", ".mp3", ".mpeg", ".mpga",
})

# Formats that use AAC/OPUS/AMR codecs — libsndfile can't read them;
# must be transcoded to PCM WAV before sending.
_CONVERT_FORMATS: frozenset[str] = frozenset({
    ".m4a", ".mp4", ".webm", ".amr",
})

SUPPORTED_FORMATS: frozenset[str] = _NATIVE_FORMATS | _CONVERT_FORMATS

# Explicit MIME map — never rely on mimetypes.guess_type() (platform-dependent)
_MIME_MAP: dict[str, str] = {
    ".mp3":  "audio/mpeg",
    ".mpga": "audio/mpeg",
    ".mpeg": "audio/mpeg",
    ".wav":  "audio/wav",
    ".flac": "audio/flac",
    ".ogg":  "audio/ogg",
    # converted formats all become WAV
    ".m4a":  "audio/wav",
    ".mp4":  "audio/wav",
    ".webm": "audio/wav",
    ".amr":  "audio/wav",
}


# ── Result type ───────────────────────────────────────────────────────────────
class TranscriptionResult(NamedTuple):
    filename:   str
    transcript: str
    summary:    str


# ── Singleton client ──────────────────────────────────────────────────────────
_inference_client: InferenceClient | None = None


def _get_client() -> InferenceClient:
    """Return a shared InferenceClient (created once, reused across calls)."""
    global _inference_client
    if _inference_client is None:
        if not HF_API_TOKEN:
            raise EnvironmentError(
                "HUGGINGFACE_API_TOKEN is not set. "
                "Add it to your .env file or environment."
            )
        _inference_client = InferenceClient(
            provider="hf-inference",   # explicit free-tier provider
            api_key=HF_API_TOKEN,
        )
    return _inference_client


# ── Audio conversion (PyAV) ───────────────────────────────────────────────────
def _to_wav_bytes(file_path: str) -> bytes:
    output_buffer = io.BytesIO()

    try:
        with av.open(file_path) as in_container:
            in_stream = in_container.streams.audio[0]

            with av.open(output_buffer, mode="w", format="wav") as out_container:
                out_stream = out_container.add_stream(
                    codec_name="pcm_s16le",
                    rate=WHISPER_SAMPLE_RATE,
                    layout="mono",
                )

                resampler = av.AudioResampler(
                    format="s16",
                    layout="mono",
                    rate=WHISPER_SAMPLE_RATE,
                )

                for frame in in_container.decode(in_stream):
                    for resampled in resampler.resample(frame):
                        resampled.pts = None   # let PyAV manage timestamps
                        for packet in out_stream.encode(resampled):
                            out_container.mux(packet)

                # Flush encoder
                for packet in out_stream.encode(None):
                    out_container.mux(packet)

    except av.AVError as exc:
        raise RuntimeError(
            f"PyAV failed to transcode '{file_path}': {exc}"
        ) from exc

    output_buffer.seek(0)
    return output_buffer.read()


def _prepare_audio(file_path: str) -> tuple[bytes, str]:
    """
    Return (audio_bytes, content_type) ready for the HF Inference API.

    • Native formats  → read raw bytes, look up MIME type.
    • Convert formats → transcode to PCM WAV via PyAV, use audio/wav.
    """
    suffix = Path(file_path).suffix.lower()

    if suffix not in SUPPORTED_FORMATS:
        raise ValueError(
            f"Unsupported audio format '{suffix}'. "
            f"Supported: {sorted(SUPPORTED_FORMATS)}"
        )

    if suffix in _CONVERT_FORMATS:
        logger.debug("Converting %s → WAV via PyAV", file_path)
        audio_bytes  = _to_wav_bytes(file_path)
        content_type = "audio/wav"
    else:
        with open(file_path, "rb") as fh:
            audio_bytes = fh.read()
        content_type = _MIME_MAP[suffix]

    logger.debug(
        "Audio prepared: %d bytes, content-type=%s", len(audio_bytes), content_type
    )
    return audio_bytes, content_type


# ── Transcription ─────────────────────────────────────────────────────────────
def _transcribe(file_path: str) -> str:

    if not HF_API_TOKEN:
        raise EnvironmentError("HUGGINGFACE_API_TOKEN is not set.")

    audio_bytes, content_type = _prepare_audio(file_path)

    response = requests.post(
        TRANSCRIPTION_URL,
        headers={
            "Authorization": f"Bearer {HF_API_TOKEN}",
            "Content-Type":  content_type,
        },
        data=audio_bytes,
        timeout=REQUEST_TIMEOUT,
    )

    if response.status_code != 200:
        raise RuntimeError(
            f"Transcription failed [{response.status_code}]: {response.text}"
        )

    transcript = response.json().get("text", "").strip()
    logger.info("Transcription complete: %d chars", len(transcript))
    return transcript


# ── Summarization ─────────────────────────────────────────────────────────────
def _summarize(transcript: str) -> str:
    client   = _get_client()
    truncated = transcript[:BART_INPUT_LIMIT]

    result = client.summarization(
        text=truncated,
        model=SUMMARIZATION_MODEL,
    )

    if hasattr(result, "summary_text"):
        return result.summary_text.strip()
    if isinstance(result, dict):
        return result.get("summary_text", "").strip()
    return str(result).strip()


# ── Public API ────────────────────────────────────────────────────────────────
async def transcribe_and_summarize(
    file_path: str,
    filename:  str,
) -> dict:
    loop = asyncio.get_event_loop()

    # Both I/O-bound calls run in a thread pool so they don't block the event loop
    transcript = await loop.run_in_executor(None, lambda: _transcribe(file_path))

    if not transcript:
        raise ValueError("Transcription returned an empty result.")

    summary = await loop.run_in_executor(None, lambda: _summarize(transcript))

    return {
        "filename": filename,
        "transcript": transcript,
        "summary": summary,
    }