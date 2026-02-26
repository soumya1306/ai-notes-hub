# AI Notes Hub 🧠

An exceptional full-stack AI-powered second brain app built with React + FastAPI + PostgreSQL.

[![Live Demo](https://img.shields.io/badge/Live-Demo-green)](https://ai-notes-hub-omega.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-Repo-blue)](https://github.com/soumya1306/ai-notes-hub)

## Current Status

- ✅ Phase 1: React UI (CRUD, tags, animations, vanilla CSS)
- ✅ Phase 2: FastAPI backend (REST API, CORS, Pydantic v2)
- ✅ Phase 3: React connected to FastAPI (localStorage replaced with API calls)
- ✅ Phase 4: PostgreSQL database (UUID keys, ARRAY tags, layered architecture)
- ✅ Phase 5: JWT Auth + Refresh Tokens (bcrypt, PyJWT, auto token refresh, frontend auth flow)
- 🔄 Phase 6: Google OAuth (in progress)
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
| Frontend   | React, Vite, Vanilla CSS, Context API       |
| Backend    | FastAPI, Pydantic v2, Python 3.14           |
| Database   | PostgreSQL 18, SQLAlchemy 2.0, pgvector     |
| Auth       | JWT (PyJWT), bcrypt, refresh token rotation |
| AI         | Gemini API, RAG pipeline (upcoming)         |
| Storage    | Cloudinary (upcoming)                       |
| DevOps     | Docker, GitHub Actions CI/CD                |
| Monitoring | Sentry (upcoming)                           |
| Deployment | Vercel (frontend), Railway (backend)        |

## Features

### Completed
- Full CRUD operations — Create, read, update, delete notes
- Tag system — Organize notes with comma-separated tags
- User registration and login — Email/password auth with JWT
- Auto token refresh — Seamless 401 handling, retries with new token
- Refresh token rotation — New refresh token issued on every refresh
- Token revocation on logout — Refresh token cleared server-side
- Per-user note isolation — Users only see their own notes
- Secure password hashing — bcrypt with salt rounds
- Auth context — Global auth state via React Context API
- Protected notes UI — Login/Register screens for unauthenticated users
- Responsive UI — Clean gradient design, smooth animations

### Coming Soon
- Google OAuth integration
- Rich text editing with TipTap
- AI-powered summarization and auto-tagging
- Semantic search with pgvector

## Project Structure

```
ai-notes-hub/
├── frontend/
│   └── src/
│       ├── api/
│       │   ├── authApi.js           # Auth endpoints (register, login, refresh, logout)
│       │   └── notesAPi.js          # Notes endpoints + Bearer tokens + auto refresh
│       ├── context/
│       │   └── AuthContext.jsx      # Global auth state, token storage
│       ├── components/
│       │   ├── LoginForm.jsx        # Login UI with error handling
│       │   ├── RegisterForm.jsx     # Register UI with error handling
│       │   ├── NoteForm.jsx         # Create note form
│       │   └── NoteList.jsx         # Notes grid display
│       ├── App.jsx                  # Main app + auth routing
│       └── main.jsx                 # AuthProvider wrapper
└── backend/
    ├── app/
    │   ├── models/
    │   │   └── models.py            # User + Note ORM models
    │   ├── schemas/
    │   │   └── schemas.py           # Pydantic request/response schemas
    │   ├── routes/
    │   │   ├── auth.py              # /auth endpoints
    │   │   └── notes.py             # /notes endpoints (protected)
    │   ├── core/
    │   │   └── auth.py              # bcrypt + PyJWT + get_current_user_id
    │   ├── crud/
    │   │   └── notes.py             # Per-user note operations
    │   └── database.py              # SQLAlchemy engine + session
    ├── main.py                      # FastAPI app entry point
    ├── requirements.txt
    └── .env
```

## Environment Setup

**Backend `.env`**
```
DATABASE_URL=postgresql://user:password@localhost:5432/ai_notes_hub
SECRET_KEY=your-super-secret-key-change-in-production
```

**Frontend `.env`**
```
VITE_API_BASE_URL=http://localhost:8000
```

## Run Locally

**Prerequisites**
- Python 3.14+
- Node.js 18+
- PostgreSQL 18+

**Backend**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

### Authentication

| Method | Endpoint        | Description                      |
|--------|-----------------|----------------------------------|
| POST   | /auth/register  | Create new user account          |
| POST   | /auth/login     | Login and receive tokens         |
| POST   | /auth/refresh   | Get new access + refresh tokens  |
| POST   | /auth/logout    | Revoke refresh token server-side |

### Notes — requires Bearer token

| Method | Endpoint      | Description                     |
|--------|---------------|---------------------------------|
| GET    | /notes/       | Get all notes for current user  |
| POST   | /notes/       | Create a new note               |
| PUT    | /notes/{id}   | Update an existing note         |
| DELETE | /notes/{id}   | Delete a note                   |

## Security Features

- **bcrypt password hashing** — Salted and hashed, Python 3.14 compatible
- **JWT access tokens** — 15-minute expiry (HS256)
- **Refresh token rotation** — New refresh token on every refresh call
- **Token revocation** — Logout clears refresh token in database
- **Per-user data isolation** — All queries scoped to authenticated user
- **Auto token refresh** — Frontend retries failed requests with refreshed token

## Database Schema

### users table

| Column           | Type    | Constraints       |
|------------------|---------|-------------------|
| id               | UUID    | PRIMARY KEY       |
| email            | VARCHAR | UNIQUE, NOT NULL  |
| hashed_password  | VARCHAR | NOT NULL          |
| refresh_token    | VARCHAR | NULLABLE          |

### notes table

| Column     | Type         | Constraints           |
|------------|--------------|-----------------------|
| id         | UUID         | PRIMARY KEY           |
| content    | VARCHAR(500) | NOT NULL              |
| tags       | VARCHAR[]    | DEFAULT []            |
| user_id    | UUID         | REFERENCES users(id)  |
| created_at | TIMESTAMP    |                       |
| updated_at | TIMESTAMP    | NULLABLE              |

## Live Demo

🔗 [https://ai-notes-hub-omega.vercel.app/](https://ai-notes-hub-omega.vercel.app/)

## What's Next

**Phase 6 — Google OAuth** for one-click sign in with Google

---

Built with ❤️ by Soumya Ranjan — [https://github.com/soumya1306](https://github.com/soumya1306)
