# AI Notes Hub 🧠

An exceptional full-stack AI-powered second brain app built with React + FastAPI + PostgreSQL.

[![Live Demo](https://img.shields.io/badge/Live-Demo-green)](https://ai-notes-hub-omega.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-Repo-blue)](https://github.com/soumya1306/ai-notes-hub)
[![CI](https://github.com/soumya1306/ai-notes-hub/actions/workflows/ci.yml/badge.svg)](https://github.com/soumya1306/ai-notes-hub/actions/workflows/ci.yml)

## Current Status

- ✅ Phase 1: React UI (CRUD, tags, animations, vanilla CSS)
- ✅ Phase 2: FastAPI backend (REST API, CORS, Pydantic v2)
- ✅ Phase 3: React connected to FastAPI (localStorage replaced with API calls)
- ✅ Phase 4: PostgreSQL database (UUID keys, ARRAY tags, layered architecture)
- ✅ Phase 5: JWT Auth + Refresh Tokens (bcrypt, PyJWT, auto token refresh, frontend auth flow)
- ✅ Phase 6: Google OAuth (Authlib 1.6.8, SessionMiddleware, React Router v6, OAuthCallback)
- ✅ Phase 7: Rich Text Editor (TipTap — toolbar, HTML rendering, smart mark handling)
- ✅ Phase 8: Gemini AI — Summarize + Auto Tags (google-genai, gemini-2.5-flash, BeautifulSoup)
- ✅ Phase 9: Search & Filter (debounced full-text search, clickable tag filter pills)
- ✅ Phase 10: Semantic Search (pgvector, gemini-embedding-001, HNSW index, mode toggle UI)
- ✅ Phase 11: RAG Q&A — Ask natural language questions answered by Gemini using your notes as context
- ✅ Phase 12: File Attachments (Cloudinary — signed server-side uploads, images/PDF/video per note)
- ✅ Phase 13: Real-time Collaboration (WebSockets, note permissions, user search, share panel)
- ✅ Phase 14: Rate Limiting + Security Headers (slowapi, Retry-After, SecurityHeadersMiddleware)
- ✅ Phase 15: Unit + Integration Tests (pytest, pytest-asyncio, httpx, rollback isolation, mocking)
- ✅ Phase 16: Docker + GitHub Actions CI/CD (Dockerfile, docker-compose, pytest in CI, auto-deploy)
- 📅 Phase 17: Sentry + Performance Monitoring
- 📅 Phase 18: System Design Doc (ARCHITECTURE.md)
- 📅 Phase 19: Full Production Deploy
- 📅 Phase 20: Polish + Portfolio README

## Tech Stack

| Layer      | Tech                                                                                    |
|------------|-----------------------------------------------------------------------------------------|
| Frontend   | React 19, Vite, Vanilla CSS, Context API, React Router v6, TipTap, react-icons         |
| Backend    | FastAPI, Pydantic v2, Python 3.14                                                       |
| Database   | PostgreSQL 17, SQLAlchemy 2.0, pgvector, Alembic                                       |
| Auth       | JWT (PyJWT), bcrypt, refresh token rotation, Google OAuth 2.0 (Authlib)                |
| AI         | google-genai, gemini-2.5-flash, gemini-embedding-001, BeautifulSoup4, RAG Q&A          |
| Storage    | Cloudinary (signed server-side uploads, images/PDF/video)                              |
| Real-time  | WebSockets (FastAPI native), per-note rooms, per-user notification channel              |
| Security   | slowapi rate limiting, SecurityHeadersMiddleware, HSTS, CSP, X-Frame-Options           |
| Testing    | pytest, pytest-asyncio, httpx AsyncClient, unittest.mock, rollback isolation           |
| DevOps     | Docker, docker-compose, GitHub Actions CI                                               |
| Monitoring | Sentry (upcoming)                                                                       |
| Deployment | Vercel (frontend), Railway (backend)                                                    |

## Features

### Completed
- Full CRUD operations — Create, read, update, delete notes
- Tag system — Organize notes with comma-separated tags
- User registration and login — Email/password auth with JWT
- Auto token refresh — Seamless 401 handling, retries with new token
- Refresh token rotation — New refresh token issued on every refresh
- Token revocation on logout — Refresh token cleared server-side
- Per-user note isolation — Users only see their own notes and shared notes
- Secure password hashing — bcrypt with salt rounds
- Auth context — Global auth state via React Context API
- Protected routes — React Router v6 with ProtectedRoute wrapper
- Google OAuth 2.0 — One-click sign in with Google via Authlib 1.6.8
- OAuth account linking — Google login links to existing email/password account
- OAuthCallback page — Handles token extraction after Google redirect
- Rich text editor — TipTap with bold, italic, strikethrough, headings, lists, code blocks, blockquotes
- HTML rendering — Note cards render TipTap HTML output correctly
- Smart mark handling — Double Enter exits active marks (code, bold, etc.)
- AI summarization — One-click Gemini AI summary displayed below each note card
- AI auto-tagging — Gemini generates and saves relevant tags automatically
- Full-text search — Debounced search across note content and tags via array_to_string ilike
- Clickable tag pills — Click any tag to instantly filter notes by that tag
- Semantic search — pgvector + gemini-embedding-001 embeddings with HNSW cosine index
- Search mode toggle — Switch between keyword and semantic search in the UI
- Auto-embed on create/update — Embeddings generated and stored with every note save
- RAG Q&A — Ask natural language questions; Gemini answers grounded in your own notes
- File attachments — Upload images, PDFs, videos, and text files to any note via Cloudinary
- Real-time collaboration — Share notes with other users as editor or viewer
- Live note updates — WebSocket-powered instant sync across all collaborators
- Typing indicators — See who is editing a note in real time (shows their email)
- Presence events — Join/leave notifications when collaborators connect or disconnect
- Note permissions — Role-based access: owner, editor, viewer
- Share panel — Search users by email with live dropdown, assign roles, revoke access
- Per-user WS channel — `/ws/user` channel for instant `note_shared` push notifications
- Owner-only delete — Only the note creator can delete; editors and viewers cannot
- Rate limiting — slowapi in-memory token bucket on all auth + AI + write endpoints
- Retry-After header — 429 responses include exact wait time; frontend surfaces friendly message
- Security headers — HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy on every response
- Unit tests — AI service mocked at Gemini client level; covers summarize, autotag, embed, ask, 429 handling
- Integration tests — Full HTTP roundtrip tests for auth, notes CRUD, attachments, semantic search, RAG Q&A
- Rollback isolation — Each test wrapped in a transaction that rolls back; zero data leakage between tests
- Rate limiter reset — limiter counters cleared before every test to prevent cross-test 429 interference
- Cloudinary mocked — `cloudinary.uploader.upload/destroy` patched at SDK level; real business logic tested
- Dockerized backend — Multi-stage Dockerfile, docker-compose with pgvector/pg17 + healthcheck
- GitHub Actions CI — Runs full pytest suite on every push/PR with Postgres service container
- Auto-deploy — Railway deploys backend and Vercel deploys frontend on every push to main
- Responsive UI — Clean gradient design, smooth animations

### Coming Soon
- Sentry error monitoring
- System design documentation

## Project Structure

```
ai-notes-hub/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions — pytest on push/PR
├── docker-compose.yml           # Local dev — backend + pgvector/pg17 DB
├── railway.json                 # Railway deploy config — points to backend/Dockerfile
├── vercel.json                  # Vercel frontend deploy config
├── frontend/
│   └── src/
│       ├── api/
│       │   ├── authApi.js           # Auth endpoints + loginWithGoogle()
│       │   └── notesAPi.js          # Notes CRUD + AI + semantic + ask + attachments + share/revoke/searchUsers + 429 handling
│       ├── context/
│       │   └── AuthContext.jsx      # Global auth state, loginWithTokens() for OAuth
│       ├── hooks/
│       │   └── useNoteSocket.js     # WebSocket hook — connect, send, auto-reconnect
│       ├── components/
│       │   ├── LoginForm.jsx        # Login UI + "Continue with Google" button
│       │   ├── RegisterForm.jsx     # Register UI with useNavigate
│       │   ├── OAuthCallback.jsx    # Handles /oauth-callback redirect from backend
│       │   ├── NoteForm.jsx         # TipTap rich text editor + toolbar
│       │   ├── NoteList.jsx         # Notes grid + inline edit + AI buttons + SharePanel + typing indicators
│       │   ├── NoteAttachments.jsx  # Per-note file upload/delete UI (Cloudinary)
│       │   └── QAPanel.jsx          # RAG Q&A panel — ask questions, get Gemini answers
│       ├── App.jsx                  # Routes + search state + keyword/semantic mode toggle + QAPanel
│       └── main.jsx                 # BrowserRouter + AuthProvider wrapper
└── backend/
    ├── Dockerfile                   # Python 3.14-slim — installs deps, runs uvicorn
    ├── .dockerignore                # Excludes __pycache__, .env, tests from image
    ├── alembic/                     # Alembic migration environment
    │   ├── versions/                # Migration scripts (one per schema change)
    │   └── env.py                   # Alembic config — reads DATABASE_URL, swaps asyncpg→psycopg2
    ├── alembic.ini                  # Alembic project config
    ├── app/
    │   ├── models/
    │   │   └── models.py            # User + Note + NotePermission + Attachment models
    │   ├── schemas/
    │   │   └── schemas.py           # Pydantic v2 schemas incl. NotePermissionResponse + ShareNoteRequest
    │   ├── routes/
    │   │   ├── auth.py              # /auth endpoints + /auth/google OAuth routes + rate limits
    │   │   ├── notes.py             # /notes CRUD + /summarize + /autotags + /semantic + /ask + /share + /collaborators + rate limits
    │   │   ├── users.py             # /users/search — search users by email for share panel
    │   │   ├── attachments.py       # /attachments upload, list, delete
    │   │   └── ws.py                # WebSocket routes — /ws/notes/{note_id} + /ws/user
    │   ├── core/
    │   │   ├── auth.py              # bcrypt + PyJWT + get_current_user_id
    │   │   └── limiter.py           # Shared slowapi Limiter instance (get_remote_address)
    │   ├── middleware/
    │   │   ├── __init__.py
    │   │   └── security.py          # SecurityHeadersMiddleware — HSTS, X-Frame-Options, Referrer-Policy etc.
    │   ├── crud/
    │   │   ├── notes.py             # CRUD + permissions + share_note + revoke_share + get_note_collaborators
    │   │   └── attachments.py       # Attachment CRUD — create, list, get, delete
    │   ├── services/
    │   │   ├── ai.py                # summarize_note() + generate_tags() + embed_text() + ask_question()
    │   │   ├── cloudinary.py        # upload_file_to_cloudinary() + delete_file_from_cloudinary()
    │   │   └── ws.py                # ConnectionManager — rooms, connect, disconnect, broadcast, close_room
    │   ├── tests/
    │   │   ├── conftest.py          # Shared fixtures — test DB engine, rollback session, AsyncClient, auth_token
    │   │   ├── unit/
    │   │   │   └── test_ai_service.py       # Unit tests for summarize, autotag, embed, ask, 429 handling
    │   │   └── integration/
    │   │       ├── test_auth_routes.py      # Register, login, refresh, logout flows
    │   │       ├── test_notes_routes.py     # Notes CRUD, summarize, autotags, semantic search, RAG Q&A, sharing
    │   │       └── test_attachment_routes.py# Upload, list, delete attachments with Cloudinary mocked
    │   └── database.py              # SQLAlchemy async engine + session
    ├── main.py                      # FastAPI app + middlewares + limiter + alembic auto-migrate on startup
    ├── requirements.txt
    └── .env

```

## Environment Setup

**Backend `.env`**
```
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/ai_notes_hub
SECRET_KEY=your-super-secret-key-change-in-production
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-google-client-secret
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=your-gemini-api-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

**Frontend `.env`**
```
VITE_API_BASE_URL=http://localhost:8000
```

## Run Locally with Docker (Recommended)

**Prerequisites**
- Docker Desktop

```bash
# 1. Clone the repo
git clone https://github.com/soumya1306/ai-notes-hub.git
cd ai-notes-hub

# 2. Add your backend .env file
cp backend/.env.example backend/.env
# Fill in your keys

# 3. Start DB only first (to generate migrations if needed)
docker compose up db -d

# 4. Generate initial migration (first time only)
docker compose run --rm backend alembic revision --autogenerate -m "initial schema"

# 5. Start everything
docker compose up --build
```

API available at `http://localhost:8000/docs` ✅

## Run Locally without Docker

**Prerequisites**
- Python 3.14+
- Node.js 18+
- PostgreSQL 17+ with pgvector extension

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

## Database Migrations

Schema is managed with **Alembic**. Migrations run automatically on app startup via `main.py`.

```bash
# Generate a new migration after changing models.py
docker compose run --rm backend alembic revision --autogenerate -m "describe your change"

# Commit the generated file — it applies automatically on next deploy
git add backend/alembic/versions/
git commit -m "feat: add migration for ..."

# Roll back one step if needed
docker compose run --rm backend alembic downgrade -1
```

## Running Tests

```bash
cd backend
pytest app/tests/ -v

# run only unit tests
pytest app/tests/unit/ -v

# run only integration tests
pytest app/tests/integration/ -v
```

Tests use rollback isolation — each test wraps in a transaction that rolls back automatically. No data ever touches your real database.

## CI/CD Pipeline

```
git push main
      ↓
GitHub Actions  →  runs pytest with Postgres service container
      ↓ (simultaneously)
Railway         →  builds Dockerfile → deploys backend API
Vercel          →  builds frontend   → deploys UI
```

GitHub Actions workflow lives at `.github/workflows/ci.yml`.

## API Endpoints

### Authentication

| Method | Endpoint              | Description                          | Rate Limit |
|--------|-----------------------|--------------------------------------|------------|
| POST   | /auth/register        | Create new user account              | 5/min      |
| POST   | /auth/login           | Login and receive tokens             | 10/min     |
| POST   | /auth/refresh         | Get new access + refresh tokens      | 20/min     |
| POST   | /auth/logout          | Revoke refresh token server-side     | —          |
| GET    | /auth/google/login    | Redirect to Google OAuth consent     | —          |
| GET    | /auth/google/callback | Handle Google redirect, issue tokens | —          |

### Notes — requires Bearer token

| Method | Endpoint                           | Description                                  | Rate Limit |
|--------|------------------------------------|----------------------------------------------|------------|
| GET    | /notes/                            | Get all notes owned or shared with user      | —          |
| GET    | /notes/semantic?q=                 | Semantic similarity search via pgvector      | 30/min     |
| POST   | /notes/ask                         | RAG Q&A — answer a question using your notes | 20/min     |
| POST   | /notes/                            | Create a new note + auto-embed               | 60/min     |
| PUT    | /notes/{id}                        | Update a note + re-embed (owner or editor)   | 60/min     |
| DELETE | /notes/{id}                        | Delete a note (owner only)                   | —          |
| POST   | /notes/{id}/summarize              | AI summary of note via Gemini                | 20/min     |
| POST   | /notes/{id}/autotags               | AI-generated tags via Gemini                 | 20/min     |
| POST   | /notes/{id}/share                  | Share note with a user by email (owner only) | 30/min     |
| DELETE | /notes/{id}/share/{target_user_id} | Revoke a user's access (owner only)          | —          |
| GET    | /notes/{id}/collaborators          | List all collaborators and their roles       | —          |

### Users — requires Bearer token

| Method | Endpoint         | Description                                    |
|--------|------------------|------------------------------------------------|
| GET    | /users/search?q= | Search users by email fragment for share panel |

### Attachments — requires Bearer token

| Method | Endpoint                     | Description                            |
|--------|------------------------------|----------------------------------------|
| POST   | /attachments/notes/{note_id} | Upload file and attach to note         |
| GET    | /attachments/notes/{note_id} | List all attachments for a note        |
| DELETE | /attachments/{attachment_id} | Delete attachment from Cloudinary + DB |

### WebSockets

| Endpoint                      | Description                                                  |
|-------------------------------|--------------------------------------------------------------|
| WS /ws/notes/{note_id}?token= | Per-note room — live updates, typing indicators, presence    |
| WS /ws/user?token=            | Per-user channel — receives `note_shared` push notifications |

## Security Features

- **bcrypt password hashing** — Salted and hashed, Python 3.14 compatible
- **JWT access tokens** — 15-minute expiry (HS256)
- **Refresh token rotation** — New refresh token on every refresh call
- **Token revocation** — Logout clears refresh token in database
- **Per-user data isolation** — All queries scoped via permissions table
- **Auto token refresh** — Frontend retries failed requests with refreshed token
- **Google OAuth 2.0** — Authlib 1.6.8, PKCE flow, state validation via SessionMiddleware
- **OAuth account linking** — Google account links to existing email/password account
- **Signed Cloudinary uploads** — Files uploaded server-side using API secret, never exposed to client
- **Role-based note access** — owner / editor / viewer enforced at every CRUD operation
- **Owner-only destructive actions** — Only owners can delete notes or revoke collaborator access
- **Rate limiting** — slowapi token bucket; brute-force protection on auth, cost protection on AI endpoints
- **Retry-After** — Every 429 response includes exact seconds to wait; frontend surfaces friendly ⏳ message
- **Security headers** — HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, X-XSS-Protection on every response

## Database Schema

### users table

| Column          | Type    | Constraints      |
|-----------------|---------|------------------|
| id              | UUID    | PRIMARY KEY      |
| email           | VARCHAR | UNIQUE, NOT NULL |
| hashed_password | TEXT    | NULLABLE         |
| google_id       | VARCHAR | NULLABLE         |
| refresh_token   | TEXT    | NULLABLE         |

### notes table

| Column     | Type        | Constraints                            |
|------------|-------------|----------------------------------------|
| id         | UUID        | PRIMARY KEY                            |
| content    | TEXT        | NOT NULL                               |
| tags       | TEXT[]      | DEFAULT []                             |
| embedding  | vector(768) | NULLABLE                               |
| user_id    | UUID        | REFERENCES users(id) ON DELETE CASCADE |
| created_at | TIMESTAMPTZ | DEFAULT now()                          |
| updated_at | TIMESTAMPTZ | NULLABLE                               |

### note_permissions table

| Column     | Type        | Constraints                                   |
|------------|-------------|-----------------------------------------------|
| id         | UUID        | PRIMARY KEY                                   |
| note_id    | UUID        | REFERENCES notes(id) ON DELETE CASCADE        |
| user_id    | UUID        | REFERENCES users(id) ON DELETE CASCADE        |
| role       | VARCHAR(10) | CHECK (role IN ('owner', 'editor', 'viewer')) |
| created_at | TIMESTAMPTZ | DEFAULT now()                                 |
|            |             | UNIQUE (note_id, user_id)                     |

### attachments table

| Column     | Type        | Constraints                            |
|------------|-------------|----------------------------------------|
| id         | UUID        | PRIMARY KEY                            |
| note_id    | UUID        | REFERENCES notes(id) ON DELETE CASCADE |
| user_id    | UUID        | REFERENCES users(id) ON DELETE CASCADE |
| file_url   | TEXT        | NOT NULL                               |
| public_id  | TEXT        | NOT NULL                               |
| filename   | TEXT        | NOT NULL                               |
| file_type  | VARCHAR(50) | NOT NULL                               |
| created_at | TIMESTAMPTZ | DEFAULT now()                          |

## Live Demo

🔗 [https://ai-notes-hub-omega.vercel.app/](https://ai-notes-hub-omega.vercel.app/)

---

Built with ❤️ by Soumya Ranjan — [https://github.com/soumya1306](https://github.com/soumya1306)
