# Architecture — AI Notes Hub

## Table of Contents

1. [System Overview](#1-system-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Backend Architecture](#4-backend-architecture)
5. [Database Design](#5-database-design)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [AI Pipeline](#7-ai-pipeline)
8. [Real-Time Collaboration](#8-real-time-collaboration)
9. [File Storage](#9-file-storage)
10. [Security Design](#10-security-design)
11. [Deployment Architecture](#11-deployment-architecture)
12. [Monitoring & Observability](#12-monitoring--observability)
13. [Design Decisions & Trade-offs](#13-design-decisions--trade-offs)

---

## 1. System Overview

AI Notes Hub is a full-stack, AI-powered note-taking application. Users can create rich-text notes, collaborate in real time, search semantically, and query their notes using natural language via a RAG (Retrieval-Augmented Generation) pipeline.

**Core capabilities:**
- Rich-text CRUD with TipTap editor
- JWT + Google OAuth authentication with refresh token rotation
- Gemini-powered summarization, auto-tagging, semantic search, and RAG Q&A
- pgvector-backed vector similarity search (HNSW index)
- Real-time collaboration via WebSockets
- File attachments via Cloudinary
- Rate limiting, security headers, RBAC
- Sentry error tracking and performance monitoring

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│                    React 19 + Vite (SPA)                        │
│              Hosted on Vercel (CDN edge network)                │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS / WSS
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Railway)                           │
│              FastAPI + Uvicorn (async Python)                   │
│         Dockerized — python:3.14-slim base image                │
└──────┬────────────────────┬───────────────────┬─────────────────┘
       │                    │                   │
       ▼                    ▼                   ▼
┌─────────────┐   ┌──────────────────┐  ┌─────────────────┐
│  PostgreSQL │   │   Google Gemini  │  │   Cloudinary    │
│  (Railway)  │   │   API (external) │  │   (external)    │
│  pgvector   │   │  gemini-2.5-flash│  │  File storage   │
│  pg17       │   │  embedding-001   │  │  images/PDF/vid │
└─────────────┘   └──────────────────┘  └─────────────────┘
                            
                  ┌──────────────────┐
                  │     Sentry       │
                  │   (external)     │
                  │ Error + Perf     │
                  └──────────────────┘
```

**Request flow (happy path):**
1. Browser sends HTTPS request with `Authorization: Bearer <access_token>`
2. FastAPI validates JWT, resolves `user_id`
3. Route handler calls CRUD layer with async SQLAlchemy session
4. CRUD queries PostgreSQL; AI routes additionally call Gemini API
5. Response serialized via Pydantic v2 and returned as JSON
6. Sentry traces the full request lifecycle end-to-end

---

## 3. Frontend Architecture

### Stack
- **React 19** — UI library with concurrent rendering
- **Vite** — build tool with HMR and native ESM
- **React Router v6** — client-side routing with `<Routes>` and `<Navigate>`
- **Context API** — global auth state (no Redux needed at this scale)
- **TipTap** — headless rich text editor built on ProseMirror
- **Vanilla CSS** — no CSS framework; full control over design

### Folder Structure
```
src/
├── api/           # All HTTP calls (authApi.js, notesApi.js)
├── context/       # AuthContext — token storage, refresh logic
├── hooks/         # useNoteSocket — WebSocket lifecycle management
├── components/    # UI components (LoginForm, NoteForm, NoteList, etc.)
├── App.jsx        # Route definitions + top-level state
└── main.jsx       # React entry point + Sentry init + ErrorBoundary
```

### State Management Strategy
- **Auth state** lives in `AuthContext` — `accessToken`, `isAuthenticated`, `logout()`, `refreshAccessToken()`
- **Notes state** lives locally in `App.jsx` — lifted up and passed as props; no global store needed
- **Search state** lives in `App.jsx` — debounced with `setTimeout` (400ms) to avoid hammering the API
- **WebSocket state** lives in `useNoteSocket` hook — encapsulates connect, reconnect, and cleanup

### Token Refresh Strategy
Every API call in `notesApi.js` wraps with a refresh interceptor:
```
1. Make API call with current access token
2. If 401 received → call /auth/refresh with refresh token (httpOnly cookie)
3. Store new access token → retry original request once
4. If refresh also fails → logout user
```
This pattern avoids token expiry interrupting the user experience silently.

### Routing
```
/login          → LoginForm (redirects to / if already authenticated)
/register       → RegisterForm
/oauth-callback → OAuthCallback (handles Google redirect)
/               → NotesPage (ProtectedRoute — redirects to /login if not authenticated)
*               → redirect to /
```

---

## 4. Backend Architecture

### Stack
- **FastAPI** — async Python web framework with automatic OpenAPI docs
- **Uvicorn** — ASGI server running FastAPI
- **SQLAlchemy 2.0** — async ORM with `AsyncSession`
- **Pydantic v2** — request/response validation and serialization
- **Alembic** — database migration management
- **slowapi** — rate limiting middleware (wraps `limits` library)

### Layered Architecture
```
HTTP Request
     ↓
Middleware layer     (CORS, SessionMiddleware, SecurityHeadersMiddleware, Sentry)
     ↓
Route handlers       (app/routes/*.py) — validates input, checks auth, delegates
     ↓
CRUD layer           (app/crud/*.py) — all database read/write logic
     ↓
Service layer        (app/services/*.py) — AI, Cloudinary, WebSocket manager
     ↓
Models + Database    (app/models/models.py + app/database.py)
```

This separation means:
- Routes never touch the DB directly — they always go through CRUD
- Services are stateless and independently testable
- CRUD functions accept a `db: AsyncSession` injected by FastAPI's dependency system

### Startup Sequence (`main.py`)
```
1. load_dotenv()                  ← load env vars
2. sentry_sdk.init(...)           ← init Sentry before anything else
3. alembic upgrade head           ← apply any pending DB migrations
4. FastAPI app created
5. Middlewares registered         ← Security → Session → CORS
6. Routers included               ← auth, notes, attachments, ws, users
```

Alembic runs on every startup — this is safe because Alembic is idempotent (skips already-applied migrations).

### Async Database Session
```python
# Every request gets a fresh AsyncSession via FastAPI dependency injection
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
```
Sessions are scoped per-request and auto-closed after the response is sent.

---

## 5. Database Design

### Engine
- **PostgreSQL 17** with the **pgvector** extension
- pgvector adds the `vector` column type and HNSW/IVFFlat index support
- Hosted on Railway with a persistent volume

### Schema

```
┌──────────────┐         ┌────────────────────┐         ┌──────────────────┐
│    users     │         │       notes        │         │   attachments    │
│──────────────│         │────────────────────│         │──────────────────│
│ id (UUID PK) │◄───┐    │ id (UUID PK)       │◄───┐    │ id (UUID PK)     │
│ email        │    │    │ content (TEXT)     │    │    │ note_id (FK)     │
│ hashed_pass  │    │    │ tags (TEXT[])      │    │    │ user_id (FK)     │
│ google_id    │    │    │ embedding (vec768) │    │    │ file_url         │
│ refresh_token│    │    │ user_id (FK) ──────┘    │    │ public_id        │
└──────────────┘    │    │ created_at         │    │    │ filename         │
                    │    │ updated_at         │    │    │ file_type        │
                    │    └────────────────────┘    │    │ created_at       │
                    │                              │    └──────────────────┘
                    │    ┌────────────────────┐    │
                    │    │  note_permissions  │    │
                    │    │────────────────────│    │
                    │    │ id (UUID PK)       │    │
                    └────┤ user_id (FK)       │    │
                         │ note_id (FK) ──────┘    │
                         │ role (owner/editor/     │
                         │       viewer)           │
                         │ created_at             │
                         │ UNIQUE(note_id,user_id) │
                         └────────────────────────┘
```

### pgvector Index
```sql
CREATE INDEX ON notes USING hnsw (embedding vector_cosine_ops);
```
- **HNSW** (Hierarchical Navigable Small World) — approximate nearest neighbor index
- Chosen over IVFFlat because HNSW has better query performance at the cost of slightly higher build time
- `vector_cosine_ops` — cosine similarity is appropriate for text embeddings (direction matters, not magnitude)
- Embedding dimension: **768** (gemini-embedding-001 output size)

### Migration Strategy
- All schema changes go through **Alembic autogenerate**
- Never manually edit migration files after generating
- Migration files are committed to the repo and auto-applied on startup
- `alembic/env.py` swaps `asyncpg` → `psycopg2` driver for Alembic's synchronous migration runner

---

## 6. Authentication & Authorization

### JWT Strategy
```
Login / OAuth
     ↓
Issue access token (15 min expiry, HS256)
   + refresh token (7 days expiry, stored in DB)
     ↓
Client stores access token in memory (not localStorage — XSS protection)
     ↓
Every request: Authorization: Bearer <access_token>
     ↓
On 401: POST /auth/refresh → new access token + new refresh token
     ↓
On refresh failure: force logout
```

**Why not httpOnly cookies for access tokens?**
Access tokens are stored in React state (in-memory). This protects against XSS since JavaScript can't steal what isn't in localStorage or cookies. The trade-off is tokens are lost on page refresh — handled by the refresh flow.

### Refresh Token Rotation
Every `/auth/refresh` call:
1. Validates the incoming refresh token against the DB
2. Issues a **new** access token + a **new** refresh token
3. Stores the new refresh token, invalidating the old one

This means stolen refresh tokens can only be used once before they're rotated out.

### Google OAuth 2.0 Flow
```
1. User clicks "Continue with Google"
2. Frontend calls GET /auth/google/login
3. Backend redirects to Google consent screen (Authlib generates URL)
4. Google redirects back to GET /auth/google/callback
5. Backend exchanges code for Google profile
6. If email exists → link Google account, issue tokens
7. If email is new → create user, issue tokens
8. Backend redirects to /oauth-callback?access_token=...&refresh_token=...
9. OAuthCallback.jsx extracts tokens and calls loginWithTokens()
```

### Role-Based Access Control (RBAC)
Every note operation checks the `note_permissions` table:

| Role   | Read | Edit | Delete | Share/Revoke |
|--------|------|------|--------|--------------|
| owner  | ✅   | ✅   | ✅     | ✅           |
| editor | ✅   | ✅   | ❌     | ❌           |
| viewer | ✅   | ❌   | ❌     | ❌           |

The owner is automatically inserted into `note_permissions` with role `owner` on note creation.

---

## 7. AI Pipeline

### Overview
All AI features use **Google Gemini** via the `google-genai` Python SDK.

```
┌──────────────┐    ┌────────────────┐    ┌──────────────────────┐
│  Note (HTML) │───▶│ BeautifulSoup4 │───▶│  Plain text content  │
└──────────────┘    │  strip HTML    │    └──────────┬───────────┘
                    └────────────────┘               │
                                          ┌──────────▼───────────┐
                                          │    Gemini API        │
                                          │  gemini-2.5-flash    │
                                          │  embedding-001       │
                                          └──────────────────────┘
```

### Summarization
- **Model:** `gemini-2.5-flash`
- **Input:** stripped plain text of note
- **Output:** 2–3 sentence summary
- **Rate limit:** 20/min per user

### Auto-Tagging
- **Model:** `gemini-2.5-flash`
- **Input:** stripped plain text
- **Output:** comma-separated tags → parsed → saved to `notes.tags`
- **Rate limit:** 20/min per user

### Semantic Embedding
- **Model:** `gemini-embedding-001`
- **Input:** stripped plain text
- **Output:** 768-dimensional float vector
- **Trigger:** auto-runs on every note create and update
- **Stored in:** `notes.embedding` (pgvector `vector(768)` column)

### Semantic Search
```
User query string
     ↓
embed_text(query) → 768-dim vector
     ↓
SELECT notes ORDER BY embedding <=> query_vector LIMIT 10
     ↓
Return top-k most similar notes
```
`<=>` is pgvector's cosine distance operator. Lower value = more similar.

### RAG Q&A Pipeline
```
User question
     ↓
embed_text(question) → vector
     ↓
Top-5 most similar notes retrieved from pgvector
     ↓
Notes injected as context into Gemini prompt:
  "Answer the question using only the notes below as context.
   Question: {question}
   Notes: {note_1} ... {note_5}"
     ↓
Gemini generates grounded answer
     ↓
Response returned to user
```

RAG grounds the model's response in the user's actual notes, preventing hallucination and making answers personally relevant.

---

## 8. Real-Time Collaboration

### WebSocket Architecture
Two separate WebSocket channels:

| Channel | Endpoint | Purpose |
|---------|----------|---------|
| Note room | `/ws/notes/{note_id}?token=` | Per-note live editing, typing indicators, presence |
| User channel | `/ws/user?token=` | Per-user push notifications (e.g. note_shared) |

### Connection Manager (`services/ws.py`)
```
ConnectionManager
├── rooms: dict[note_id → list[WebSocket]]   ← per-note connections
└── user_channels: dict[user_id → WebSocket] ← per-user connection

Methods:
├── connect(ws, note_id, user_id)
├── disconnect(ws, note_id, user_id)
├── broadcast(note_id, message, exclude=None)
├── send_to_user(user_id, message)
└── close_room(note_id)
```

### Message Protocol
All messages are JSON with a `type` field:

```json
// Client → Server
{ "type": "note_update", "content": "<p>...</p>", "tags": ["ai"] }
{ "type": "typing",      "user_email": "user@example.com" }

// Server → Client  
{ "type": "note_update", "content": "<p>...</p>", "tags": ["ai"], "user_email": "..." }
{ "type": "typing",      "user_email": "user@example.com" }
{ "type": "presence",    "event": "join",  "user_email": "..." }
{ "type": "presence",    "event": "leave", "user_email": "..." }
{ "type": "note_shared", "note_id": "...", "role": "editor" }
```

### Reconnect Strategy
The frontend (`useNoteSocket.js`) uses exponential-style reconnect:
```
WebSocket closes unexpectedly
     ↓
Wait 3 seconds
     ↓
Reconnect (if component still mounted)
```
An `alive` ref guards against reconnecting after the component unmounts.

### 60-Second Fallback Poll
In addition to WebSockets, `App.jsx` polls `GET /notes/` every 60 seconds as a safety net — catches any updates that the WebSocket may have missed (e.g. during a brief disconnect).

---

## 9. File Storage

### Strategy
Files are **never stored on the backend server**. The backend acts as a signing proxy:

```
Client selects file
     ↓
POST /attachments/notes/{note_id}  (multipart/form-data)
     ↓
Backend reads file bytes
     ↓
Calls cloudinary.uploader.upload() server-side using API secret
     ↓
Cloudinary returns { secure_url, public_id }
     ↓
Backend saves { file_url, public_id, filename, file_type } to DB
     ↓
Returns attachment metadata to client
```

**Why server-side uploads?**
If the client uploaded directly to Cloudinary, the `API_SECRET` would need to be exposed in the browser — a critical security risk. Server-side signing keeps the secret in the backend environment only.

### Deletion
```
DELETE /attachments/{attachment_id}
     ↓
Backend fetches attachment (verifies ownership)
     ↓
Calls cloudinary.uploader.destroy(public_id)
     ↓
Deletes DB record
```

Cloudinary's `public_id` is stored in the DB specifically to enable server-side deletion.

---

## 10. Security Design

### Layers of Defense

```
Internet
   ↓
Vercel / Railway (TLS termination — HTTPS/WSS enforced)
   ↓
SecurityHeadersMiddleware
   ├── Strict-Transport-Security (HSTS) — force HTTPS for 1 year
   ├── X-Content-Type-Options: nosniff — prevent MIME sniffing
   ├── X-Frame-Options: DENY — prevent clickjacking
   ├── Referrer-Policy: strict-origin-when-cross-origin
   ├── Permissions-Policy — disable camera, mic, geolocation
   └── X-XSS-Protection: 1; mode=block
   ↓
CORS middleware — only FRONTEND_URL origin allowed
   ↓
JWT validation on every protected route
   ↓
RBAC check in every CRUD operation
   ↓
Rate limiting (slowapi) — per-endpoint token buckets
   ↓
PostgreSQL — parameterized queries via SQLAlchemy (no SQL injection)
```

### Rate Limiting Table

| Endpoint group   | Limit   | Reason                              |
|------------------|---------|-------------------------------------|
| /auth/register   | 5/min   | Prevent account enumeration         |
| /auth/login      | 10/min  | Brute-force protection              |
| /auth/refresh    | 20/min  | Prevent token farming               |
| AI endpoints     | 20/min  | Gemini API cost protection          |
| Semantic search  | 30/min  | Embedding API cost protection       |
| Note writes      | 60/min  | General abuse prevention            |

---

## 11. Deployment Architecture

### Infrastructure

```
Developer machine
      │
      │  git push origin main
      ▼
GitHub (source of truth)
      │
      ├──▶ GitHub Actions CI
      │         └── spins up postgres service container
      │         └── runs: pytest app/tests/ -v
      │         └── ❌ does NOT block Railway/Vercel deploys
      │
      ├──▶ Railway (backend)
      │         └── detects push to main
      │         └── reads railway.json → builder: DOCKERFILE
      │         └── builds backend/Dockerfile
      │         └── runs: uvicorn main:app --host 0.0.0.0 --port 8000
      │         └── alembic upgrade head runs on startup
      │
      └──▶ Vercel (frontend)
                └── detects push to main
                └── reads vercel.json
                └── runs: npm run build (Vite)
                └── deploys static assets to CDN edge
```

### Docker Setup (Local Dev)
```yaml
services:
  db:
    image: pgvector/pgvector:pg17
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build: ./backend
    depends_on: [db]
    env_file: backend/.env
```

The `db` service uses a named volume so data persists across `docker compose down` / `up` cycles.

### Environment Variables

| Variable | Where set | Used by |
|----------|-----------|---------|
| DATABASE_URL | Railway / local .env | SQLAlchemy + Alembic |
| SECRET_KEY | Railway / local .env | JWT signing |
| GOOGLE_CLIENT_ID/SECRET | Railway / local .env | OAuth |
| GEMINI_API_KEY | Railway / local .env | AI service |
| CLOUDINARY_* | Railway / local .env | File uploads |
| SENTRY_DSN | Railway / local .env | Backend Sentry |
| APP_ENV | Railway / local .env | Sentry environment tag |
| VITE_API_BASE_URL | Vercel / .env.example | Frontend API calls |
| VITE_WS_BASE_URL | Vercel / .env.example | Frontend WebSocket |
| VITE_SENTRY_DSN | Vercel / .env.example | Frontend Sentry |

---

## 12. Monitoring & Observability

### Sentry Backend (`sentry-sdk[fastapi]`)
- **FastApiIntegration** — automatically captures unhandled exceptions per request, records HTTP method, URL, status code
- **SqlalchemyIntegration** — traces slow DB queries, captures query errors
- **traces_sample_rate: 1.0** — 100% of transactions traced in dev; reduce to 0.1 in high-traffic production
- **send_default_pii: False** — GDPR-safe; no user emails or IPs sent to Sentry by default
- **APP_ENV** tag — separates `development` vs `production` issues in Sentry dashboard

### Sentry Frontend (`@sentry/react`)
- **browserTracingIntegration** — captures page load performance, navigation timing, and API call durations
- **replayIntegration** — records session replays on errors (text masked, media blocked for privacy)
- **replaysOnErrorSampleRate: 1.0** — always capture a replay when an error occurs
- **ErrorBoundary** — wraps entire app; catches React render errors, reports to Sentry, shows fallback UI

### What Gets Tracked
| Event | Backend | Frontend |
|-------|---------|----------|
| Unhandled exceptions | ✅ | ✅ |
| API request traces | ✅ | ✅ (as spans) |
| Slow DB queries | ✅ | — |
| React render errors | — | ✅ (ErrorBoundary) |
| Session replays on error | — | ✅ |
| Page load performance | — | ✅ |

### CI Behavior
`SENTRY_DSN` is set to an empty string in GitHub Actions — this disables Sentry silently during tests so test noise never pollutes the Sentry dashboard.

---

## 13. Design Decisions & Trade-offs

### Why FastAPI over Django/Flask?
FastAPI's native `async/await` support maps directly to async DB drivers (`asyncpg`) and async AI API calls. Django's ORM is synchronous by default, and Flask requires third-party async extensions. FastAPI also generates OpenAPI docs automatically — essential for API development speed.

### Why PostgreSQL + pgvector over a dedicated vector DB (Pinecone, Weaviate)?
Keeping vectors in the same Postgres instance eliminates a network hop and a separate service to maintain. At this scale (thousands of notes per user), pgvector with HNSW index is more than sufficient. The trade-off is that at millions of records, a dedicated vector DB would outperform pgvector.

### Why SQLAlchemy async over raw asyncpg?
SQLAlchemy provides the ORM layer (model definitions, relationships, migrations via Alembic) while still using asyncpg as the underlying driver. Raw asyncpg would require writing SQL strings manually and building a migration system from scratch.

### Why in-memory rate limiting (slowapi) over Redis-backed?
For a single-instance deployment (Railway runs one container), in-memory rate limiting is sufficient and has zero infrastructure overhead. The trade-off: if the app scales to multiple instances, counters would be per-instance rather than global — at that point, migrating to a Redis-backed limiter would be necessary.

### Why Cloudinary over S3?
Cloudinary provides a free tier, built-in image transformation, and a simple Python SDK — ideal for a portfolio project. S3 would be the production choice at scale due to lower cost per GB and tighter AWS ecosystem integration.

### Why access tokens in memory (not localStorage)?
localStorage is accessible to any JavaScript on the page — a successful XSS attack would immediately steal all tokens. In-memory storage (React state) means tokens are lost on refresh but are invisible to injected scripts. The refresh token handles seamless re-authentication.

### Why Alembic auto-migrate on startup?
Railway doesn't support running pre-deploy scripts natively without a custom entrypoint. Running `alembic upgrade head` in `main.py` at startup guarantees the schema is always up-to-date before the first request is served. The operation is idempotent — it's a no-op if all migrations are already applied.
