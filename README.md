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

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.12, Uvicorn |
| AI Models | Google Gemini 1.5 Flash, HuggingFace (Whisper + BART) |
| Containerization | Docker, Docker Compose |

---

## 🔧 Prerequisites

- **Docker** & **Docker Compose** (for containerized setup)
- **Node.js** 18+ (for local frontend development)
- **Python** 3.10+ (for local backend development)
- A **Gemini API key** from [aistudio.google.com](https://aistudio.google.com/app/apikey)
- *(Optional)* A **Hugging Face token** from [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

---

## 🐳 Docker Setup (Recommended)

### Quick Start — Run Both Servers with One Command

```bash
# 1. Clone the repo
git clone https://github.com/maaz64/voice-ai.git
cd voice-ai

# 2. Create the backend .env file
cp backend/.env.example backend/.env
# Edit backend/.env and add your API keys:
#   GEMINI_API_KEY=your_gemini_key
#   HUGGINGFACE_API_TOKEN=your_hf_token (optional)

# 3. Build and run both services
docker compose up --build
```

> Frontend → `http://localhost:3000`
> Backend  → `http://localhost:8000`
> API Docs → `http://localhost:8000/docs`

### Docker Compose Commands

```bash
# Build and start all services (foreground)
docker compose up --build

# Build and start in detached/background mode
docker compose up --build -d

# View running containers
docker compose ps

# View logs for all services
docker compose logs

# View logs for a specific service
docker compose logs backend
docker compose logs frontend

# Follow logs in real-time
docker compose logs -f

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v

# Rebuild a single service
docker compose up --build backend
docker compose up --build frontend

# Restart services
docker compose restart

# Restart a specific service
docker compose restart backend
docker compose restart frontend
```

---

### 🔨 Build Docker Images Individually

#### Backend Image

```bash
# Build
docker build -t voicescribe-backend ./backend

# Run
docker run -d \
  --name voicescribe-backend \
  -p 8000:8000 \
  --env-file ./backend/.env \
  voicescribe-backend

# Run with inline env vars (alternative)
docker run -d \
  --name voicescribe-backend \
  -p 8000:8000 \
  -e GEMINI_API_KEY=your_gemini_key \
  -e HUGGINGFACE_API_TOKEN=your_hf_token \
  -e ALLOWED_ORIGINS=http://localhost:3000 \
  voicescribe-backend
```

#### Frontend Image

```bash
# Build (pass backend URL as build arg)
docker build -t voicescribe-frontend \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:8000 \
  ./frontend

# Run
docker run -d \
  --name voicescribe-frontend \
  -p 3000:3000 \
  voicescribe-frontend
```

### 🛠️ Common Docker Commands

```bash
# List all running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Stop a container
docker stop voicescribe-backend
docker stop voicescribe-frontend

# Start a stopped container
docker start voicescribe-backend
docker start voicescribe-frontend

# Remove a container
docker rm voicescribe-backend
docker rm voicescribe-frontend

# Remove an image
docker rmi voicescribe-backend
docker rmi voicescribe-frontend

# View container logs
docker logs voicescribe-backend
docker logs voicescribe-frontend

# Follow container logs in real-time
docker logs -f voicescribe-backend

# Open a shell inside a running container
docker exec -it voicescribe-backend /bin/bash
docker exec -it voicescribe-frontend /bin/sh

# Inspect a container
docker inspect voicescribe-backend

# Prune unused images and containers
docker system prune -f
```

---

## 🚀 Local Setup (Without Docker)

### 1. Clone / Navigate to the project

```bash
git clone https://github.com/maaz64/voice-ai.git
cd voice-ai
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

## 📁 Project Structure

```
audio-transcript-app/
├── docker-compose.yml              # Orchestrate both services
├── backend/
│   ├── Dockerfile                  # Backend container config
│   ├── main.py                     # FastAPI app + CORS
│   ├── routes/transcribe.py        # POST /api/transcribe
│   ├── services/
│   │   ├── gemini_service.py       # Gemini 1.5 Flash
│   │   └── huggingface_service.py  # Whisper + BART
│   ├── models/schemas.py           # Pydantic models
│   ├── utils/audio_utils.py        # Validation + temp file mgmt
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── Dockerfile                  # Multi-stage frontend build
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                # Main page
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

---

## 📄 License

MIT
