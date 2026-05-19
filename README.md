# 🎙️ VoiceScribe AI

Audio transcription and summarization app powered by **Google Gemini** and **Hugging Face** (Whisper + BART).

Record from your microphone or upload an audio file → get a full transcript and an AI-generated summary.

---

## Features

- 🎤 **Live recording** — record directly from your browser mic
- 📂 **File upload** — `.mp3`, `.wav`, `.m4a`, `.ogg`, `.webm` (up to 25 MB)
- 📝 **Transcription** — word-for-word transcript
- 🤖 **Summarization** — 3–5 sentence AI summary
- ⬇️ **Download** — export transcript & summary as `.txt`
- 🔄 **Two AI providers** — choose between Gemini or Hugging Face

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.12, Uvicorn |
| AI | Google Gemini 1.5 Flash, Hugging Face (Whisper + BART) |

---

## Prerequisites

- **Node.js** 18 or higher — [nodejs.org](https://nodejs.org)
- **Python** 3.10 or higher — [python.org](https://www.python.org/downloads/)
- A **Gemini API key** — [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- *(Optional)* A **Hugging Face token** — [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/maaz64/voice-ai.git
cd voice-ai
```

### 2. Set up the backend

```bash
cd backend

# Create a virtual environment
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create your env file
cp .env.example .env
```

Open `backend/.env` and add your API keys:

```
GEMINI_API_KEY=your_gemini_key_here
HUGGINGFACE_API_TOKEN=your_hf_token_here
```

Start the backend:

```bash
uvicorn main:app --reload --port 8000
```

Backend runs at → **http://localhost:8000**
API docs at → **http://localhost:8000/docs**

### 3. Set up the frontend

Open a **new terminal**, then:

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Frontend runs at → **http://localhost:3000**

### 4. Use the app

Open **http://localhost:3000** in your browser. Record audio or upload a file, pick a provider (Gemini or Hugging Face), and hit transcribe.

---

## Environment Variables

### Backend — `backend/.env`

| Variable | Description | Required |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `HUGGINGFACE_API_TOKEN` | Hugging Face API token | Optional |
| `MAX_FILE_SIZE_MB` | Max upload size in MB (default: 25) | No |
| `ALLOWED_ORIGINS` | CORS origins (default: `http://localhost:3000`) | No |

### Frontend — `frontend/.env.local`

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend URL (default: `http://localhost:8000`) |

---

## API

### `POST /api/transcribe`

Upload audio and get a transcript + summary.

**Request** — `multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `file` | File | Audio file |
| `provider` | string | `"gemini"` or `"huggingface"` (default: `"gemini"`) |

**Response**

```json
{
  "transcript": "Full transcript text...",
  "summary": "Concise summary...",
  "duration_seconds": 12.4,
  "provider_used": "gemini"
}
```

### `GET /health`

```json
{ "status": "ok", "service": "VoiceScribe AI" }
```

---

## Project Structure

```
audio-transcript-app/
├── backend/
│   ├── main.py                     # FastAPI app entry point
│   ├── routes/transcribe.py        # /api/transcribe endpoint
│   ├── services/
│   │   ├── gemini_service.py       # Gemini transcription + summarization
│   │   └── huggingface_service.py  # Whisper + BART pipeline
│   ├── models/schemas.py           # Request/response schemas
│   ├── utils/audio_utils.py        # File validation helpers
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── AudioRecorder.tsx
│   │   ├── FileUploader.tsx
│   │   ├── TranscriptCard.tsx
│   │   ├── SummaryCard.tsx
│   │   └── ProcessingStatus.tsx
│   ├── lib/api.ts
│   └── .env.local
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Docker (Optional)

If you prefer Docker, you can run both services with one command:

```bash
# Make sure backend/.env exists with your API keys, then:
docker compose up --build
```

This starts the backend on port 8000 and frontend on port 3000.

---

## Get API Keys

| Service | Link |
|---|---|
| Google Gemini | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |
| Hugging Face | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) |

---

## License

MIT
