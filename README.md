# AI Notes Hub 🧠

An exceptional full-stack AI-powered second brain app built with React + FastAPI + PostgreSQL.

[![Live Demo](https://img.shields.io/badge/Live-Demo-green)](https://ai-notes-hub-omega.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-Repo-blue)](https://github.com/soumya1306/ai-notes-hub)

## Current Status

- ✅ Phase 1: React UI (CRUD, tags, animations, vanilla CSS)
- ✅ Phase 2: FastAPI backend (REST API, CORS, Pydantic v2)
- ✅ Phase 3: React connected to FastAPI (localStorage replaced with API calls)
- ✅ Phase 4: PostgreSQL database (UUID keys, ARRAY tags, layered architecture)
- 🔄 Phase 5: JWT Auth + Refresh Tokens (in progress)
- 📅 Phase 6: Google OAuth
- 📅 Phase 7: Rich Text Editor (TipTap)
- 📅 Phase 8: Gemini AI — Summarize + Auto Tags
- 📅 Phase 9: Semantic Search (pgvector)
- 📅 Phase 10: RAG — Q&A on Notes
- 📅 Phase 11: File Attachments (Cloudinary)
- 📅 Phase 12: Real-time Collaboration (WebSockets)
- 📅 Phase 13: Rate Limiting + Security Headers
- 📅 Phase 14: Unit + Integration Tests
- 📅 Phase 15: Docker + GitHub Actions CI/CD
- 📅 Phase 16: Sentry + Performance Monitoring
- 📅 Phase 17: System Design Doc (ARCHITECTURE.md)
- 📅 Phase 18: Full Production Deploy
- 📅 Phase 19: Polish + Portfolio README

## Tech Stack

| Layer      | Tech                                        |
|------------|---------------------------------------------|
| Frontend   | React, Vite, Vanilla CSS, TipTap (upcoming) |
| Backend    | FastAPI, Pydantic v2, Python 3              |
| Database   | PostgreSQL 18, SQLAlchemy, pgvector         |
| AI         | Gemini API, RAG pipeline (upcoming)         |
| Auth       | JWT + Refresh Tokens, Google OAuth          |
| Storage    | Cloudinary (upcoming)                       |
| DevOps     | Docker, GitHub Actions CI/CD                |
| Monitoring | Sentry (upcoming)                           |
| Deployment | Vercel (frontend), Railway (backend)        |

## Project Structure

    ai-notes-hub/
    ├── frontend/
    │   └── src/
    │       ├── api/
    │       │   └── notesApi.js
    │       ├── components/
    │       │   ├── NoteForm.jsx
    │       │   └── NoteList.jsx
    │       ├── App.jsx
    │       └── main.jsx
    └── backend/
        ├── main.py
        ├── database.py
        ├── models.py
        ├── schemas.py
        └── crud.py

## Run Locally

**Backend:**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

| Method | Endpoint     | Description     |
|--------|--------------|-----------------|
| GET    | /notes       | Get all notes   |
| GET    | /notes/{id}  | Get single note |
| POST   | /notes       | Create note     |
| PUT    | /notes/{id}  | Update note     |
| DELETE | /notes/{id}  | Delete note     |

## Live Demo

🔗 [https://ai-notes-hub-omega.vercel.app/](https://ai-notes-hub-omega.vercel.app/)
