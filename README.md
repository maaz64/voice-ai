# 🎙️ VoiceScribe AI

**Audio Transcription & Summarization** powered by Google Gemini and Hugging Face.

Record from your microphone or upload audio files — get instant word-for-word transcripts and AI-generated summaries.

---

## 📋 Overview

| Feature | Details |
|---|---|
| 🎤 Live Recording | Browser mic via MediaRecorder API |
| 📂 File Upload | `.mp3`, `.wav`, `.m4a`, `.ogg`, `.webm` (max 25MB) |
| 📝 Transcription | Word-for-word transcript |
| 🤖 Summarization | 3-5 sentence AI summary |
| ⬇️ Downloads | Export transcript & summary as `.txt` |
| 🔄 Providers | Gemini 1.5 Flash · Whisper + BART (HuggingFace) |

---

## 🔧 Prerequisites

- **Node.js** 18+
- **Python** 3.10+
- **pip** (Python package manager)
- A **Gemini API key** from [aistudio.google.com](https://aistudio.google.com/app/apikey)
- *(Optional)* A **Hugging Face token** from [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

---

## 🚀 Setup & Run

### 1. Clone / Navigate to the project

```bash
cd audio-transcript-app
```

### 2. Backend Setup

```bash
cd backend

# Create a virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure env
cp .env.example .env
# Edit .env and fill in:
#   GEMINI_API_KEY=your_gemini_key
#   HUGGINGFACE_API_TOKEN=your_hf_token  (optional)

# Start the server
uvicorn main:app --reload --port 8000
```

Backend will be live at: `http://localhost:8000`
Interactive API docs: `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Frontend will be live at: `http://localhost:3000`

---

## 🌍 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Required |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key | ✅ Yes |
| `HUGGINGFACE_API_TOKEN` | HuggingFace Inference API token | Optional |
| `MAX_FILE_SIZE_MB` | Max upload size (default: 25) | No |
| `ALLOWED_ORIGINS` | CORS origins (default: `http://localhost:3000`) | No |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend URL (default: `http://localhost:8000`) |

---

## 📡 API Documentation

### `POST /api/transcribe`

Transcribe audio and generate a summary.

**Request** — `multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `file` | `File` | Audio file (`.mp3`, `.wav`, `.m4a`, `.ogg`, `.webm`) |
| `provider` | `string` | `"gemini"` or `"huggingface"` (default: `"gemini"`) |

**Success Response** `200 OK`

```json
{
  "transcript": "Full transcript text here...",
  "summary": "Concise summary here...",
  "duration_seconds": 12.4,
  "provider_used": "gemini"
}
```

**Error Response**

```json
{
  "detail": "Error message"
}
```

### `GET /health`

Health check.

```json
{ "status": "ok", "service": "VoiceScribe AI" }
```

---

## 🔑 Get API Keys

| Service | Link |
|---|---|
| Google Gemini | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |
| Hugging Face | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) |

---

## 🏗️ Project Structure

```
audio-transcript-app/
├── backend/
│   ├── main.py                  # FastAPI app + CORS
│   ├── routes/transcribe.py     # POST /api/transcribe
│   ├── services/
│   │   ├── gemini_service.py    # Gemini 1.5 Flash
│   │   └── huggingface_service.py  # Whisper + BART
│   ├── models/schemas.py        # Pydantic models
│   ├── utils/audio_utils.py     # Validation + temp file mgmt
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Main page
│   │   └── globals.css
│   ├── components/
│   │   ├── AudioRecorder.tsx
│   │   ├── FileUploader.tsx
│   │   ├── TranscriptCard.tsx
│   │   ├── SummaryCard.tsx
│   │   └── ProcessingStatus.tsx
│   ├── lib/api.ts
│   └── .env.local
├── .gitignore
└── README.md
```
