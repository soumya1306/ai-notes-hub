# AI Notes Hub 🧠

A full-stack AI-powered notes app built with React + FastAPI + PostgreSQL.

[![Live Demo](https://img.shields.io/badge/Live-Demo-green)](https://ai-notes-hub-omega.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-Repo-blue)](https://github.com/soumya1306/ai-notes-hub)

## Current Status

- ✅ Phase 1: React UI (CRUD, tags, animations, vanilla CSS)
- ✅ Phase 2: FastAPI backend (REST API, CORS, Pydantic v2)
- ✅ Phase 3: PostgreSQL database (UUID keys, ARRAY tags, real persistence)
- 🔄 Phase 4: Connect Frontend to Backend (API calls replace localStorage)
- 📅 Phase 5: AI features (summarize, semantic search)

## Tech Stack

| Layer      | Tech                             |
|------------|----------------------------------|
| Frontend   | React, Vite, Vanilla CSS         |
| Backend    | FastAPI, Pydantic v2, Python 3   |
| Database   | PostgreSQL 18, SQLAlchemy        |
| Deployment | Vercel (frontend), TBD (backend) |

## Project Structure

    ai-notes-hub/
    ├── frontend/        # React + Vite
    └── backend/
        ├── main.py
        ├── database.py
        ├── models.py
        ├── schemas.py
        └── routers/
            └── notes.py

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
