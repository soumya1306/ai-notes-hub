# AI Notes Hub 🧠
### A production-grade, AI-powered second brain — built end-to-end by a solo developer

> Full-stack GenAI app featuring semantic search, RAG Q&A, real-time collaboration,
> JWT + Google OAuth, file attachments, WebSockets, Docker CI/CD, and Sentry monitoring.
> Shipped across 21 incremental production phases — every feature live in production.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge)](https://ai-notes-hub-omega.vercel.app/)
[![CI](https://github.com/soumya1306/ai-notes-hub/actions/workflows/ci.yml/badge.svg)](https://github.com/soumya1306/ai-notes-hub/actions/workflows/ci.yml)
[![Python](https://img.shields.io/badge/Python-3.14-blue?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

![App overview](./assets/demo-notes-ui.gif)

---

## Why I Built This

I wanted to go beyond typical CRUD tutorials and build something that mirrors real production engineering — full auth flows, vector search, live collaboration, and an AI pipeline. Every feature in this repo is something I had to actually figure out: pgvector HNSW indexing, in-memory token security, WebSocket reconnect strategies, server-side Cloudinary signing. This is the project I wish existed as a reference when I was learning.

Live: https://ai-notes-hub-omega.vercel.app/  
Backend API Docs: https://ai-notes-hub-backend-production.up.railway.app/docs

---

## Tech Stack

| Layer      | Tech                                                                                     |
|------------|------------------------------------------------------------------------------------------|
| Frontend   | React 19, Vite, Vanilla CSS (design token system), React Router v6, TipTap, react-icons |
| Backend    | FastAPI, Pydantic v2, Python 3.14, Uvicorn                                               |
| Database   | PostgreSQL 17, SQLAlchemy 2.0 (async), pgvector, Alembic                                 |
| Auth       | JWT (PyJWT), bcrypt, refresh token rotation, Google OAuth 2.0 (Authlib 1.6.8)           |
| AI         | google-genai, gemini-2.5-flash, gemini-embedding-001, BeautifulSoup4, RAG Q&A            |
| Storage    | Cloudinary (signed server-side uploads — images, PDF, video)                             |
| Real-time  | WebSockets (FastAPI native), per-note rooms, per-user notification channel               |
| Security   | slowapi rate limiting, SecurityHeadersMiddleware, HSTS, X-Frame-Options, CSP             |
| Testing    | pytest, pytest-asyncio, httpx AsyncClient, unittest.mock, rollback isolation             |
| DevOps     | Docker, docker-compose, GitHub Actions CI                                                |
| Monitoring | Sentry (error tracking, performance tracing, session replay, ErrorBoundary)              |
| Deployment | Vercel (frontend), Railway (backend + PostgreSQL)                                        |

---

## Architecture

<pre>
+------------------------------------------------------------------+
|                      CLIENT (Browser)                            |
|               React 19 + Vite SPA - hosted on Vercel            |
+-----------------------------+------------------------------------+
                              | HTTPS / WSS
                              v
+------------------------------------------------------------------+
|                     BACKEND (Railway)                            |
|              FastAPI + Uvicorn (async Python 3.14)               |
|           Dockerized - python:3.14-slim base image               |
+-------+---------------------+------------------+----------------+
        |                     |                  |
        v                     v                  v
+--------------+   +--------------------+  +----------------+
|  PostgreSQL  |   |   Google Gemini    |  |   Cloudinary   |
|  (Railway)   |   |  gemini-2.5-flash  |  |  File storage  |
|  pgvector    |   |  embedding-001     |  |  images/PDF    |
+--------------+   +--------------------+  +----------------+
                              |
                    +---------v--------+
                    |     Sentry       |
                    |  Error + Perf    |
                    +------------------+
</pre>

Request flow: Browser → HTTPS → JWT validation → CRUD layer → PostgreSQL.  
AI routes additionally call Gemini. See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full system design doc.

---

## Interesting Engineering Problems

These are the parts that required real problem-solving — not just wiring up a library:

- **In-memory XSS-safe token storage** — access tokens live in React state, never `localStorage`. A silent `/auth/refresh` call on every page load restores the session without the user noticing.
- **WebSocket failure resilience** — when the WS connection drops, an `alive` ref guards against double-reconnect loops, and a 60-second fallback poll keeps the UI consistent until the socket re-establishes.
- **pgvector HNSW vs IVFFlat** — chose HNSW for better recall on small-to-medium datasets without needing a training step. Cosine similarity on 768-dimension Gemini embeddings with a mode toggle between keyword and semantic in the UI.
- **Server-side Cloudinary signing** — the API secret never reaches the browser. Backend acts as a signing proxy; `public_id` stored in DB enables reliable server-side deletion without client involvement.
- **RBAC enforced at every layer** — owner / editor / viewer roles checked not just on routes but inside every CRUD function, so no permission escalation is possible through indirect API calls.
- **Alembic on Railway cold start** — Railway has no pre-deploy hook. Running `alembic upgrade head` inside `main.py` startup is idempotent and guarantees schema correctness before the first request lands.

---

## Features

### AI

![AI summarize and autotag](./assets/demo-ai-features.gif)

- **AI Summarization** — One-click Gemini 2.5 Flash summary rendered below each note
- **AI Auto-tagging** — Gemini generates and saves relevant tags automatically
- **Semantic Search** — pgvector + gemini-embedding-001 HNSW cosine index; toggle between keyword and semantic mode

![RAG Q&A](./assets/demo-ai-features.gif)

- **RAG Q&A** — Ask natural language questions; Gemini answers grounded in your own notes via top-5 vector retrieval

### Auth and Security

- JWT access tokens (15-min expiry) + refresh token rotation (7-day expiry)
- Google OAuth 2.0 with account linking (Authlib 1.6.8)
- bcrypt password hashing; refresh token revocation on logout
- Rate limiting on all auth + AI + write endpoints (slowapi)
- Security headers on every response: HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy

### Real-time Collaboration

![Real-time collaboration](./assets/demo-collaboration.gif)

- WebSocket per-note rooms: live content sync, typing indicators, presence events
- Per-user `/ws/user` channel for instant `note_shared` push notifications
- Role-based access: owner / editor / viewer enforced at every CRUD operation
- Share modal with live email search, role assignment, and revoke access

### Editor and Storage

- TipTap rich-text editor: bold, italic, strikethrough, headings, lists, code blocks, blockquotes
- File attachments via Cloudinary: images, PDFs, videos per note (signed server-side upload)

### Observability and Quality

- Sentry backend: FastApiIntegration + SqlalchemyIntegration; performance tracing, slow DB query capture
- Sentry frontend: session replay on errors, ErrorBoundary, browser tracing
- Full pytest suite: unit tests (AI service mocked at SDK level) + integration tests (rollback isolation, Cloudinary mocked)
- GitHub Actions CI: full pytest suite on every push/PR with Postgres service container

### UI and UX

- Responsive two-layout system: DesktopNotes two-pane layout + MobileNotes dedicated mobile view
- DesktopNoteDetailsAndEdit: dedicated desktop note detail and inline edit component
- Collapsible sidebar with navigation links
- UserMenu with avatar, dropdown, and sign-out
- ShareModal: dedicated share modal component with backdrop blur
- Toast notification system (success, error, warning, info variants)
- Keyboard shortcuts panel in note detail view
- Mobile-first: 44×44px touch targets, iOS auto-zoom prevention, safe-area insets
- CSS design token system: full color scale as custom properties, semantic gradient tokens

---

## Build Phases

- ✅ Phase 1: React UI (CRUD, tags, animations, vanilla CSS)
- ✅ Phase 2: FastAPI backend (REST API, CORS, Pydantic v2)
- ✅ Phase 3: React connected to FastAPI
- ✅ Phase 4: PostgreSQL (UUID keys, ARRAY tags, layered architecture)
- ✅ Phase 5: JWT Auth + Refresh Tokens (bcrypt, PyJWT, auto token refresh)
- ✅ Phase 6: Google OAuth (Authlib 1.6.8, SessionMiddleware, OAuthCallback)
- ✅ Phase 7: Rich Text Editor (TipTap — toolbar, HTML rendering, smart mark handling)
- ✅ Phase 8: Gemini AI — Summarize + Auto Tags (google-genai, gemini-2.5-flash, BeautifulSoup)
- ✅ Phase 9: Search and Filter (debounced full-text search, clickable tag filter pills)
- ✅ Phase 10: Semantic Search (pgvector, gemini-embedding-001, HNSW index, mode toggle UI)
- ✅ Phase 11: RAG Q&A — Ask natural language questions answered by Gemini using your notes as context
- ✅ Phase 12: File Attachments (Cloudinary — signed server-side uploads, images/PDF/video per note)
- ✅ Phase 13: Real-time Collaboration (WebSockets, note permissions, user search, share panel)
- ✅ Phase 14: Rate Limiting + Security Headers (slowapi, Retry-After, SecurityHeadersMiddleware)
- ✅ Phase 15: Unit + Integration Tests (pytest, pytest-asyncio, httpx, rollback isolation, mocking)
- ✅ Phase 16: Docker + GitHub Actions CI/CD (Dockerfile, docker-compose, pytest in CI, auto-deploy)
- ✅ Phase 17: Sentry + Performance Monitoring (sentry-sdk[fastapi], @sentry/react, ErrorBoundary, tracing, session replay)
- ✅ Phase 18: System Design Doc (ARCHITECTURE.md)
- ✅ Phase 19: Full Production Deploy (Railway + Vercel, Alembic auto-migrations)
- ✅ Phase 20: UI Polish (DesktopNotes two-pane layout, MobileNotes, DesktopNoteDetailsAndEdit, ShareModal, UserMenu, toast system, CSS design tokens)
- ✅ Phase 21: Portfolio README + Engineering retrospective

---

## Project Structure

<pre>
ai-notes-hub/
├── ARCHITECTURE.md
├── README.md
├── .github/
│   └── workflows/
│       └── ci.yml
├── docker-compose.yml
├── vercel.json
├── frontend/
│   ├── .env.example
│   └── src/
│       ├── App.css                           # Full CSS design token system + all component styles
│       ├── App.jsx                           # Routes + auth + layout switching
│       ├── index.css
│       ├── main.jsx                          # BrowserRouter + AuthProvider + Sentry.init + ErrorBoundary
│       ├── api/
│       │   ├── authApi.js                    # Auth endpoints + loginWithGoogle()
│       │   └── notesAPi.js                   # Notes CRUD + AI + semantic + ask + attachments + share
│       ├── context/
│       │   └── AuthContext.jsx               # Global auth state, loginWithTokens() for OAuth
│       ├── hooks/
│       │   └── useNoteSocket.js              # WebSocket hook — connect, send, auto-reconnect
│       └── components/
│           ├── DesktopNotes.jsx              # Desktop two-pane notes layout
│           ├── DesktopNoteDetailsAndEdit.jsx  # Desktop note detail + inline edit view
│           ├── MobileNotes.jsx               # Dedicated mobile notes layout
│           ├── NoteForm.jsx                  # TipTap rich text editor + toolbar
│           ├── NoteList.jsx                  # Notes grid + note cards + AI buttons
│           ├── NoteAttachments.jsx           # Per-note file upload/delete UI (Cloudinary)
│           ├── QAPanel.jsx                   # RAG Q&A panel
│           ├── ShareModal.jsx                # Share modal — email search, roles, revoke
│           ├── UserMenu.jsx                  # Avatar dropdown — profile info + sign out
│           ├── LoginForm.jsx                 # Login UI + Continue with Google
│           ├── RegisterForm.jsx              # Register UI
│           └── OAuthCallback.jsx             # Handles /oauth-callback redirect
└── backend/
    ├── Dockerfile
    ├── railway.json
    ├── .dockerignore
    ├── alembic/
    │   ├── versions/
    │   └── env.py
    ├── alembic.ini
    ├── app/
    │   ├── models/
    │   │   └── models.py                     # User + Note + NotePermission + Attachment
    │   ├── schemas/
    │   │   └── schemas.py                    # Pydantic v2 schemas
    │   ├── routes/
    │   │   ├── auth.py                       # /auth endpoints + Google OAuth + rate limits
    │   │   ├── notes.py                      # /notes CRUD + AI + semantic + RAG + sharing
    │   │   ├── users.py                      # /users/search
    │   │   ├── attachments.py                # /attachments upload, list, delete
    │   │   └── ws.py                         # WebSocket routes
    │   ├── core/
    │   │   ├── auth.py                       # bcrypt + PyJWT + get_current_user_id
    │   │   └── limiter.py                    # Shared slowapi Limiter instance
    │   ├── middleware/
    │   │   └── security.py                   # SecurityHeadersMiddleware
    │   ├── crud/
    │   │   ├── notes.py                      # CRUD + permissions + share + revoke
    │   │   └── attachments.py                # Attachment CRUD
    │   ├── services/
    │   │   ├── ai.py                         # summarize + autotag + embed + ask
    │   │   ├── cloudinary.py                 # upload + delete
    │   │   └── ws.py                         # ConnectionManager
    │   ├── tests/
    │   │   ├── conftest.py
    │   │   ├── unit/
    │   │   │   └── test_ai_service.py
    │   │   └── integration/
    │   │       ├── test_auth_routes.py
    │   │       ├── test_notes_routes.py
    │   │       └── test_attachment_routes.py
    │   └── database.py
    ├── main.py
    └── requirements.txt
</pre>

---

## Prerequisites

Before running locally, make sure you have:

- **Node.js 20+** — for the frontend
- **Python 3.14+** — for the backend (if running without Docker)
- **Docker + Docker Compose** — recommended for the backend
- **PostgreSQL 17+ with pgvector** — only needed without Docker
- **Gemini API key** — get one free at [Google AI Studio](https://aistudio.google.com/)
- **Cloudinary account** — free tier is sufficient
- **Google OAuth credentials** — from [Google Cloud Console](https://console.cloud.google.com/)

---

## Run Locally

### Backend with Docker (Recommended)

```bash
git clone https://github.com/soumya1306/ai-notes-hub.git
cd ai-notes-hub
cp backend/.env.example backend/.env
# Fill in your keys in backend/.env
docker compose up --build
```

Backend API available at http://localhost:8000/docs

### Frontend (always run manually)

```bash
cd frontend
cp .env.example .env.local
# Fill in your keys in .env.local
npm install && npm run dev
```

Frontend available at http://localhost:5173

### Backend without Docker

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

---

## Environment Setup

**Backend** — Railway dashboard (production) or `backend/.env` (dev):

```env
DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/ai_notes_hub
SECRET_KEY=your-super-secret-key-change-in-production
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-google-client-secret
FRONTEND_URL=https://your-vercel-app.vercel.app
GEMINI_API_KEY=your-gemini-api-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
SENTRY_DSN=https://xxxx@oXXXX.ingest.sentry.io/YYYY
APP_ENV=production
```

**Frontend** — Vercel dashboard (production) or `frontend/.env.local` (dev):

```env
VITE_API_BASE_URL=https://your-railway-backend.up.railway.app
VITE_WS_BASE_URL=wss://your-railway-backend.up.railway.app
VITE_SENTRY_DSN=https://xxxx@oXXXX.ingest.sentry.io/ZZZZ
```

---

## API Reference

### Authentication

| Method | Endpoint              | Description                          | Rate Limit |
|--------|-----------------------|--------------------------------------|------------|
| POST   | /auth/register        | Create new user account              | 5/min      |
| POST   | /auth/login           | Login and receive tokens             | 10/min     |
| POST   | /auth/refresh         | Get new access + refresh tokens      | 20/min     |
| POST   | /auth/logout          | Revoke refresh token server-side     | —          |
| GET    | /auth/google/login    | Redirect to Google OAuth consent     | —          |
| GET    | /auth/google/callback | Handle Google redirect, issue tokens | —          |

### Notes — Bearer token required

| Method | Endpoint                           | Description                             | Rate Limit |
|--------|------------------------------------|-----------------------------------------|------------|
| GET    | /notes/                            | Get all notes owned or shared with user | —          |
| GET    | /notes/semantic?q=                 | Semantic similarity search via pgvector | 30/min     |
| POST   | /notes/ask                         | RAG Q&A                                 | 20/min     |
| POST   | /notes/                            | Create a new note + auto-embed          | 60/min     |
| PUT    | /notes/{id}                        | Update a note + re-embed                | 60/min     |
| DELETE | /notes/{id}                        | Delete a note (owner only)              | —          |
| POST   | /notes/{id}/summarize              | AI summary via Gemini                   | 20/min     |
| POST   | /notes/{id}/autotags               | AI-generated tags via Gemini            | 20/min     |
| POST   | /notes/{id}/share                  | Share note with a user by email         | 30/min     |
| DELETE | /notes/{id}/share/{target_user_id} | Revoke a user's access                  | —          |
| GET    | /notes/{id}/collaborators          | List all collaborators and their roles  | —          |

### Attachments — Bearer token required

| Method | Endpoint                     | Description                            |
|--------|------------------------------|----------------------------------------|
| POST   | /attachments/notes/{note_id} | Upload file and attach to note         |
| GET    | /attachments/notes/{note_id} | List all attachments for a note        |
| DELETE | /attachments/{attachment_id} | Delete attachment from Cloudinary + DB |

### WebSockets

| Endpoint                      | Description                                               |
|-------------------------------|-----------------------------------------------------------|
| WS /ws/notes/{note_id}?token= | Per-note room — live updates, typing indicators, presence |
| WS /ws/user?token=            | Per-user channel — receives note_shared notifications     |

---

## Database Schema

### users
| Column          | Type    | Constraints      |
|-----------------|---------|------------------|
| id              | UUID    | PRIMARY KEY      |
| email           | VARCHAR | UNIQUE, NOT NULL |
| hashed_password | TEXT    | NULLABLE         |
| google_id       | VARCHAR | NULLABLE         |
| refresh_token   | TEXT    | NULLABLE         |

### notes
| Column     | Type        | Constraints                            |
|------------|-------------|----------------------------------------|
| id         | UUID        | PRIMARY KEY                            |
| content    | TEXT        | NOT NULL                               |
| tags       | TEXT[]      | DEFAULT []                             |
| embedding  | vector(768) | NULLABLE                               |
| user_id    | UUID        | REFERENCES users(id) ON DELETE CASCADE |
| created_at | TIMESTAMPTZ | DEFAULT now()                          |
| updated_at | TIMESTAMPTZ | NULLABLE                               |

### note_permissions
| Column     | Type        | Constraints                                 |
|------------|-------------|---------------------------------------------|
| id         | UUID        | PRIMARY KEY                                 |
| note_id    | UUID        | REFERENCES notes(id) ON DELETE CASCADE      |
| user_id    | UUID        | REFERENCES users(id) ON DELETE CASCADE      |
| role       | VARCHAR(10) | CHECK (role IN ('owner','editor','viewer')) |
| created_at | TIMESTAMPTZ | DEFAULT now()                               |

### attachments
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

---

## Running Tests

```bash
cd backend
pytest app/tests/ -v

# Unit tests only
pytest app/tests/unit/ -v

# Integration tests only
pytest app/tests/integration/ -v
```

Tests use rollback isolation — every test wraps in a transaction that rolls back automatically. Zero data leakage between tests.

---

## CI/CD Pipeline

<pre>
git push main
      |
      v
GitHub Actions  →  runs full pytest suite with Postgres service container
Railway         →  auto-deploys backend → alembic upgrade head → uvicorn
Vercel          →  auto-deploys frontend → Vite build → CDN edge
</pre>

GitHub Actions runs tests as a quality gate but does not block Railway or Vercel deploys. Both platforms watch `main` directly — deliberate for a solo-developer workflow where deploy speed matters.

---

## Database Migrations

```bash
cd backend
alembic revision --autogenerate -m "describe your change"
git add alembic/versions/ && git commit -m "feat: add migration for ..."
# Applies automatically on next deploy via alembic upgrade head in main.py
```

Never delete migration files. Each is a permanent record of a schema change.

---

## Security

- bcrypt password hashing + JWT (HS256, 15-min access / 7-day refresh)
- Refresh token rotation — stolen tokens invalidated after first use
- In-memory access tokens — never in `localStorage` (XSS protection)
- Google OAuth 2.0 with PKCE + state validation via SessionMiddleware
- Signed Cloudinary uploads — API secret never exposed to browser
- RBAC at every CRUD operation — owner / editor / viewer
- Rate limiting (slowapi) + Retry-After on every 429
- Security headers on every response: HSTS, X-Frame-Options, CSP, Referrer-Policy, Permissions-Policy

---

## Monitoring

- Sentry backend: FastApiIntegration + SqlalchemyIntegration; traces requests, captures slow queries
- Sentry frontend: session replay on errors, page load tracing, ErrorBoundary fallback UI
- CI: Sentry DSN set to empty string in GitHub Actions; no test noise in Sentry dashboard

---

## What's Next

- Redis-backed rate limiting for multi-instance horizontal scale
- Per-note conflict resolution (operational transforms or CRDTs) for true simultaneous editing
- LLM model selection UI — swap between Gemini models per note
- Note export to Markdown / PDF
- Pinned notes + folder organization

---

Built with love by Soumya Ranjan — [github.com/soumya1306](https://github.com/soumya1306)