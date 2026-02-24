# AI Notes Hub 🧠

A full-stack AI-powered notes app built with React + FastAPI.

[![Live Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](https://ai-notes-hub-omega.vercel.app/)

## Current Status
- ✅ Phase 1: React UI (CRUD, tags, animations, vanilla CSS)
- ✅ Phase 2: FastAPI backend (REST API, CORS, Pydantic v2)
- 🔄 Phase 3: PostgreSQL database (next)
- 📅 Phase 4: AI features (summarize, semantic search)

## Tech Stack
| Layer | Tech |
|---|---|
| Frontend | React, Vite, Vanilla CSS |
| Backend | FastAPI, Pydantic v2, Python 3 |
| Database | PostgreSQL (coming) |
| Deployment | Vercel (frontend), TBD (backend) |

## Project Structure
\```
ai-notes-hub/
├── frontend/   # React + Vite
└── backend/    # FastAPI
\```

## Run Locally
**Backend:**
\```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
\```

**Frontend:**
\```bash
cd frontend
npm install
npm run dev
\```

## Live Demo
https://ai-notes-hub-omega.vercel.app/
