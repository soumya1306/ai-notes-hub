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
- ✅ Phase 8: Gemini AI — Summarize + Auto Tags (google-genai, gemini-2.5-flash-lite, BeautifulSoup)
- ✅ Phase 9: Search & Filter (debounced full-text search, clickable tag filter pills)
- ✅ Phase 10: Semantic Search (pgvector, text-embedding-004, HNSW index, mode toggle UI)
- 📅 Phase 11: RAG — Q&A on Notes
- 📅 Phase 12: File Attachments (Cloudinary)
- 📅 Phase 13: Real-time Collaboration (WebSockets)
- 📅 Phase 14: Rate Limiting + Security Headers
- 📅 Phase 15: Unit + Integration Tests
- 📅 Phase 16: Docker + GitHub Actions CI/CD
- 📅 Phase 17: Sentry + Performance Monitoring
- 📅 Phase 18: System Design Doc (ARCHITECTURE.md)
- 📅 Phase 19: Full Production Deploy
- 📅 Phase 20: Polish + Portfolio README

## Tech Stack

| Layer      | Tech                                                                                          |
|------------|-----------------------------------------------------------------------------------------------|
| Frontend   | React 19, Vite, Vanilla CSS, Context API, React Router v6, TipTap, react-icons               |
| Backend    | FastAPI, Pydantic v2, Python 3.14                                                             |
| Database   | PostgreSQL 18, SQLAlchemy 2.0, Alembic, pgvector                                             |
| Auth       | JWT (PyJWT), bcrypt, refresh token rotation, Google OAuth 2.0 (Authlib)                      |
| AI         | google-genai, gemini-2.5-flash-lite, text-embedding-004, BeautifulSoup4, RAG (upcoming)      |
| Storage    | Cloudinary (upcoming)                                                                         |
| DevOps     | Docker, GitHub Actions CI/CD (upcoming)                                                       |
| Monitoring | Sentry (upcoming)                                                                             |
| Deployment | Vercel (frontend), Railway (backend)                                                          |

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
- AI summarization — One-click Gemini AI summary displayed below each note card
- AI auto-tagging — Gemini generates and saves relevant tags automatically
- Full-text search — Debounced search across note content and tags via array_to_string ilike
- Clickable tag pills — Click any tag to instantly filter notes by that tag
- Semantic search — pgvector + text-embedding-004 embeddings with HNSW cosine index
- Search mode toggle — Switch between keyword and semantic search in the UI
- Auto-embed on create/update — Embeddings generated and stored with every note save
- Responsive UI — Clean gradient design, smooth animations

### Coming Soon
- RAG — Q&A on your own notes
- File attachments with Cloudinary
- Real-time collaboration with WebSockets

## Project Structure

```
ai-notes-hub/
├── frontend/
│   └── src/
│       ├── api/
│       │   ├── authApi.js           # Auth endpoints + loginWithGoogle()
│       │   └── notesAPi.js          # Notes CRUD + summarizeNote() + autoTagNote() + semanticSearch()
│       ├── context/
│       │   └── AuthContext.jsx      # Global auth state, loginWithTokens() for OAuth
│       ├── components/
│       │   ├── LoginForm.jsx        # Login UI + "Continue with Google" button
│       │   ├── RegisterForm.jsx     # Register UI with useNavigate
│       │   ├── OAuthCallback.jsx    # Handles /oauth-callback redirect from backend
│       │   ├── NoteForm.jsx         # TipTap rich text editor + toolbar
│       │   └── NoteList.jsx         # Notes grid + inline edit + AI buttons + clickable tags
│       ├── App.jsx                  # Routes + search state + keyword/semantic mode toggle
│       └── main.jsx                 # BrowserRouter + AuthProvider wrapper
└── backend/
    ├── app/
    │   ├── models/
    │   │   └── models.py            # User + Note models, Vector(768) embedding + HNSW index
    │   ├── schemas/
    │   │   └── schemas.py           # Pydantic v2 schemas incl. SemanticSearchResult
    │   ├── routes/
    │   │   ├── auth.py              # /auth endpoints + /auth/google OAuth routes
    │   │   └── notes.py             # /notes CRUD + /summarize + /autotags + /semantic
    │   ├── core/
    │   │   └── auth.py              # bcrypt + PyJWT + get_current_user_id
    │   ├── crud/
    │   │   └── notes.py             # CRUD + search filter + semantic_search()
    │   ├── services/
    │   │   └── ai.py                # summarize_note() + generate_tags() + embed_text()
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
GEMINI_API_KEY=your-gemini-api-key
```

**Frontend `.env`**
```
VITE_API_BASE_URL=http://localhost:8000
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

| Method | Endpoint                | Description                              |
|--------|-------------------------|------------------------------------------|
| GET    | /notes/                 | Get all notes (optional ?search= param)  |
| GET    | /notes/semantic?q=      | Semantic similarity search via pgvector  |
| POST   | /notes/                 | Create a new note + auto-embed           |
| PUT    | /notes/{id}             | Update a note + re-embed                 |
| DELETE | /notes/{id}             | Delete a note                            |
| POST   | /notes/{id}/summarize   | AI summary of note via Gemini            |
| POST   | /notes/{id}/autotags    | AI-generated tags via Gemini             |

## Security Features

- **bcrypt password hashing** — Salted and hashed, Python 3.14 compatible
- **JWT access tokens** — 30-minute expiry (HS256)
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

| Column     | Type        | Constraints          |
|------------|-------------|----------------------|
| id         | UUID        | PRIMARY KEY          |
| content    | TEXT        | NOT NULL             |
| tags       | VARCHAR[]   | DEFAULT []           |
| embedding  | vector(768) | NULLABLE             |
| user_id    | UUID        | REFERENCES users(id) |
| created_at | TIMESTAMP   |                      |
| updated_at | TIMESTAMP   | NULLABLE             |

## Live Demo

🔗 [https://ai-notes-hub-omega.vercel.app/](https://ai-notes-hub-omega.vercel.app/)

## What's Next

**Phase 11 — RAG Q&A** — Ask natural language questions about your notes; Gemini answers using retrieved note context

---

Built with ❤️ by Soumya Ranjan — [https://github.com/soumya1306](https://github.com/soumya1306)
