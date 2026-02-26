from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.database import engine, Base
from app.routes import notes, auth

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Notes Hub", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(notes.router)

@app.get("/")
async def root():
    return {"status": "ok", "message": "AI Notes Hub v3.0.0 is running!"}
