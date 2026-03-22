import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv
from app.routes import notes, auth, attachments, ws, users

from alembic.config import Config as AlembicConfig
from alembic import command as alembic_command

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.limiter import limiter
from app.middleware.security import SecurityHeadersMiddleware

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

load_dotenv()

# Initialize Sentry
sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN", ""),
    integrations=[FastApiIntegration(), SqlalchemyIntegration()],
    traces_sample_rate=1.0,
    profile_session_sample_rate=1.0,
    environment=os.getenv("APP_ENV", "production"),
    send_default_pii=False,
)

# Run any pending migrations automatically on startup
_alembic_cfg = AlembicConfig(os.path.join(os.path.dirname(__file__), "alembic.ini"))
alembic_command.upgrade(_alembic_cfg, "head")

app = FastAPI(title="AI Notes Hub", version="5.0.0")

app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    retry_after = exc.headers.get("Retry-After", 60) if exc.headers else 60
    return JSONResponse(
        status_code=429,
        content={"detail": f"Rate limit exceeded: {exc.detail}"},
        headers={"Retry-After": str(retry_after)},
    )


app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(
    SessionMiddleware, secret_key=os.getenv("SECRET_KEY", "your_secret_key_here")
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(notes.router)
app.include_router(attachments.router)
app.include_router(ws.router)
app.include_router(users.router)


@app.get("/")
async def root():
    return {"status": "ok", "message": "AI Notes Hub v5.0.0 is running!"}
