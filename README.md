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
- ✅ Phase 6: Google OAuth (Authlib 1.6.8, SessionMiddleware, React Router v6, OAuthCallback)
- ✅ Phase 7: Rich Text Editor (TipTap — toolbar, HTML rendering, smart mark handling)
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

| Layer      | Tech                                                                    |
|------------|-------------------------------------------------------------------------|
| Frontend   | React, Vite, Vanilla CSS, Context API, React Router v6, TipTap          |
| Backend    | FastAPI, Pydantic v2, Python 3.14                                        |
| Database   | PostgreSQL 18, SQLAlchemy 2.0, Alembic                                   |
| Auth       | JWT (PyJWT), bcrypt, refresh token rotation, Google OAuth 2.0            |
| AI         | Gemini API, RAG pipeline (upcoming)                                      |
| Storage    | Cloudinary (upcoming)                                                    |
| DevOps     | Docker, GitHub Actions CI/CD                                             |
| Monitoring | Sentry (upcoming)                                                        |
| Deployment | Vercel (frontend), Railway (backend)                                     |

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
- Protected routes — React Router v6 with ProtectedRoute wrapper
- Google OAuth 2.0 — One-click sign in with Google via Authlib 1.6.8
- OAuth account linking — Google login links to existing email/password account
- OAuthCallback page — Handles token extraction after Google redirect
- Rich text editor — TipTap with bold, italic, strikethrough, headings, lists, code blocks, blockquotes
- HTML rendering — Note cards render TipTap HTML output correctly
- Smart mark handling — Double Enter exits active marks (code, bold, etc.)
- Responsive UI — Clean gradient design, smooth animations

### Coming Soon
- AI-powered summarization and auto-tagging with Gemini
- Semantic search with pgvector
- File attachments with Cloudinary
- Real-time collaboration with WebSockets

## Project Structure

```
ai-notes-hub/
├── frontend/
│   └── src/
│       ├── api/
│       │   ├── authApi.js           # Auth endpoints + loginWithGoogle()
│       │   └── notesAPi.js          # Notes endpoints + Bearer tokens + auto refresh
│       ├── context/
│       │   └── AuthContext.jsx      # Global auth state, loginWithTokens() for OAuth
│       ├── components/
│       │   ├── LoginForm.jsx        # Login UI + "Continue with Google" button
│       │   ├── RegisterForm.jsx     # Register UI with useNavigate
│       │   ├── OAuthCallback.jsx    # Handles /oauth-callback redirect from backend
│       │   ├── NoteForm.jsx         # TipTap rich text editor + toolbar
│       │   └── NoteList.jsx         # Notes grid with HTML rendering + inline edit
│       ├── App.jsx                  # React Router v6 routes + ProtectedRoute
│       └── main.jsx                 # BrowserRouter + AuthProvider wrapper
└── backend/
    ├── app/
    │   ├── models/
    │   │   └── models.py            # User (+ google_id) + Note ORM models
    │   ├── schemas/
    │   │   └── schemas.py           # Pydantic request/response schemas
    │   ├── routes/
    │   │   ├── auth.py              # /auth endpoints + /auth/google OAuth routes
    │   │   └── notes.py             # /notes endpoints (protected)
    │   ├── core/
    │   │   └── auth.py              # bcrypt + PyJWT + get_current_user_id
    │   ├── crud/
    │   │   └── notes.py             # Per-user note operations
    │   └── database.py              # SQLAlchemy engine + session
    ├── main.py                      # FastAPI app + SessionMiddleware + CORS
    ├── requirements.txt
    └── .env
```

## Environment Setup

**Backend `.env`**
```
DATABASE_URL=postgresql://user:password@localhost:5432/ai_notes_hub
SECRET_KEY=your-super-secret-key-change-in-production
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-google-client-secret
FRONTEND_URL=http://localhost:5173
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
alembic upgrade head
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

| Method | Endpoint              | Description                          |
|--------|-----------------------|--------------------------------------|
| POST   | /auth/register        | Create new user account              |
| POST   | /auth/login           | Login and receive tokens             |
| POST   | /auth/refresh         | Get new access + refresh tokens      |
| POST   | /auth/logout          | Revoke refresh token server-side     |
| GET    | /auth/google/login    | Redirect to Google OAuth consent     |
| GET    | /auth/google/callback | Handle Google redirect, issue tokens |

### Notes — requires Bearer token

| Method | Endpoint    | Description                    |
|--------|-------------|--------------------------------|
| GET    | /notes/     | Get all notes for current user |
| POST   | /notes/     | Create a new note              |
| PUT    | /notes/{id} | Update an existing note        |
| DELETE | /notes/{id} | Delete a note                  |

## Security Features

- **bcrypt password hashing** — Salted and hashed, Python 3.14 compatible
- **JWT access tokens** — 15-minute expiry (HS256)
- **Refresh token rotation** — New refresh token on every refresh call
- **Token revocation** — Logout clears refresh token in database
- **Per-user data isolation** — All queries scoped to authenticated user
- **Auto token refresh** — Frontend retries failed requests with refreshed token
- **Google OAuth 2.0** — Authlib 1.6.8, PKCE flow, state validation via SessionMiddleware
- **OAuth account linking** — Google account links to existing email/password account

## Database Schema

### users table

| Column          | Type    | Constraints      |
|-----------------|---------|------------------|
| id              | UUID    | PRIMARY KEY      |
| email           | VARCHAR | UNIQUE, NOT NULL |
| hashed_password | VARCHAR | NULLABLE         |
| google_id       | VARCHAR | UNIQUE, NULLABLE |
| refresh_token   | VARCHAR | NULLABLE         |

### notes table

| Column     | Type      | Constraints          |
|------------|-----------|----------------------|
| id         | UUID      | PRIMARY KEY          |
| content    | TEXT      | NOT NULL             |
| tags       | VARCHAR[] | DEFAULT []           |
| user_id    | UUID      | REFERENCES users(id) |
| created_at | TIMESTAMP |                      |
| updated_at | TIMESTAMP | NULLABLE             |

## Live Demo

🔗 [https://ai-notes-hub-omega.vercel.app/](https://ai-notes-hub-omega.vercel.app/)

## What's Next

**Phase 8 — Gemini AI** — AI-powered note summarization and automatic tag generation using Google Gemini API

---

Built with ❤️ by Soumya Ranjan — [https://github.com/soumya1306](https://github.com/soumya1306)
