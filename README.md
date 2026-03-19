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
- ✅ Phase 8: Gemini AI — Summarize + Auto Tags (google-genai, gemini-2.5-flash, BeautifulSoup)
- ✅ Phase 9: Search & Filter (debounced full-text search, clickable tag filter pills)
- ✅ Phase 10: Semantic Search (pgvector, gemini-embedding-001, HNSW index, mode toggle UI)
- ✅ Phase 11: RAG Q&A — Ask natural language questions answered by Gemini using your notes as context
- ✅ Phase 12: File Attachments (Cloudinary — signed server-side uploads, images/PDF/video per note)
- ✅ Phase 13: Real-time Collaboration (WebSockets, note permissions, user search, share panel)
- 📅 Phase 14: Rate Limiting + Security Headers
- 📅 Phase 15: Unit + Integration Tests
- 📅 Phase 16: Docker + GitHub Actions CI/CD
- 📅 Phase 17: Sentry + Performance Monitoring
- 📅 Phase 18: System Design Doc (ARCHITECTURE.md)
- 📅 Phase 19: Full Production Deploy
- 📅 Phase 20: Polish + Portfolio README

## Tech Stack

| Layer      | Tech                                                                                        |
|------------|---------------------------------------------------------------------------------------------|
| Frontend   | React 19, Vite, Vanilla CSS, Context API, React Router v6, TipTap, react-icons             |
| Backend    | FastAPI, Pydantic v2, Python 3.14                                                           |
| Database   | PostgreSQL 18, SQLAlchemy 2.0, pgvector, Alembic                                           |
| Auth       | JWT (PyJWT), bcrypt, refresh token rotation, Google OAuth 2.0 (Authlib)                    |
| AI         | google-genai, gemini-2.5-flash, gemini-embedding-001, BeautifulSoup4, RAG Q&A              |
| Storage    | Cloudinary (signed server-side uploads, images/PDF/video)                                  |
| Real-time  | WebSockets (FastAPI native), per-note rooms, per-user notification channel                  |
| DevOps     | Docker, GitHub Actions CI/CD (upcoming)                                                     |
| Monitoring | Sentry (upcoming)                                                                           |
| Deployment | Vercel (frontend), Railway (backend)                                                        |

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
- Responsive UI — Clean gradient design, smooth animations

### Coming Soon
- Rate limiting + security headers
- Unit + integration tests
- Docker + GitHub Actions CI/CD

## Project Structure

```
ai-notes-hub/
├── frontend/
│   └── src/
│       ├── api/
│       │   ├── authApi.js           # Auth endpoints + loginWithGoogle()
│       │   └── notesAPi.js          # Notes CRUD + AI + semantic + ask + attachments + share/revoke/searchUsers
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
    ├── alembic/                     # Alembic migration environment
    │   ├── versions/                # Migration scripts (one per schema change)
    │   └── env.py                   # Alembic config — reads DATABASE_URL from .env
    ├── alembic.ini                  # Alembic project config
    ├── app/
    │   ├── models/
    │   │   └── models.py            # User + Note + NotePermission + Attachment models
    │   ├── schemas/
    │   │   └── schemas.py           # Pydantic v2 schemas incl. NotePermissionResponse + ShareNoteRequest
    │   ├── routes/
    │   │   ├── auth.py              # /auth endpoints + /auth/google OAuth routes
    │   │   ├── notes.py             # /notes CRUD + /summarize + /autotags + /semantic + /ask + /share + /collaborators
    │   │   ├── users.py             # /users/search — search users by email for share panel
    │   │   ├── attachments.py       # /attachments upload, list, delete
    │   │   └── ws.py                # WebSocket routes — /ws/notes/{note_id} + /ws/user
    │   ├── core/
    │   │   └── auth.py              # bcrypt + PyJWT + get_current_user_id
    │   ├── crud/
    │   │   ├── notes.py             # CRUD + permissions + share_note + revoke_share + get_note_collaborators
    │   │   └── attachments.py       # Attachment CRUD — create, list, get, delete
    │   ├── services/
    │   │   ├── ai.py                # summarize_note() + generate_tags() + embed_text() + ask_question()
    │   │   ├── cloudinary.py        # upload_file_to_cloudinary() + delete_file_from_cloudinary()
    │   │   └── ws.py                # ConnectionManager — rooms, connect, disconnect, broadcast, close_room
    │   └── database.py              # SQLAlchemy engine + session
    ├── main.py                      # FastAPI app + SessionMiddleware + CORS + all routers
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
GEMINI_API_KEY=your-gemini-api-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

**Frontend `.env`**
```
VITE_API_BASE_URL=http://localhost:8000
```

## Database Setup

Schema is fully managed with **Alembic**. To create all tables from scratch:

```bash
cd backend
alembic upgrade head
```

That's it. Alembic runs all migrations in order and creates every table — `users`, `notes`, `attachments`, `note_permissions` — along with the HNSW index and all backfills.

> `pgvector` must be installed on your system first (`brew install pgvector` on Mac).

### Creating New Migrations

Any future schema change should be done via Alembic:

```bash
# auto-generate a migration from model changes
alembic revision --autogenerate -m "describe your change"

# apply it
alembic upgrade head

# roll back one step if needed
alembic downgrade -1
```

## Run Locally

**Prerequisites**
- Python 3.14+
- Node.js 18+
- PostgreSQL 18+ with pgvector extension installed

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

| Method | Endpoint                           | Description                                  |
|--------|------------------------------------|----------------------------------------------|
| GET    | /notes/                            | Get all notes owned or shared with user      |
| GET    | /notes/semantic?q=                 | Semantic similarity search via pgvector      |
| POST   | /notes/ask                         | RAG Q&A — answer a question using your notes |
| POST   | /notes/                            | Create a new note + auto-embed               |
| PUT    | /notes/{id}                        | Update a note + re-embed (owner or editor)   |
| DELETE | /notes/{id}                        | Delete a note (owner only)                   |
| POST   | /notes/{id}/summarize              | AI summary of note via Gemini                |
| POST   | /notes/{id}/autotags               | AI-generated tags via Gemini                 |
| POST   | /notes/{id}/share                  | Share note with a user by email (owner only) |
| DELETE | /notes/{id}/share/{target_user_id} | Revoke a user's access (owner only)          |
| GET    | /notes/{id}/collaborators          | List all collaborators and their roles       |

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
