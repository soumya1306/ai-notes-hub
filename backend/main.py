import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv
from app.routes import notes, auth, attachments, ws, users

from alembic.config import Config as AlembicConfig
from alembic import command as alembic_command

load_dotenv()

# Run any pending migrations automatically on startup
_alembic_cfg = AlembicConfig("alembic.ini")
alembic_command.upgrade(_alembic_cfg, "head")

app = FastAPI(title="AI Notes Hub", version="5.0.0")

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
