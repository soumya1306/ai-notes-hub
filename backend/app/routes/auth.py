import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User
from app.schemas.schemas import UserCreate, UserLogin, TokenResponse, RefreshRequest
from app.core.auth import hash_password, verify_password, create_access_token, create_refresh_token,verify_token

from authlib.integrations.starlette_client import OAuth, OAuthError
from starlette.requests import Request

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", status_code=201)
def register(payload: UserCreate, db: Session = Depends(get_db)):
  
  if db.query(User).filter(User.email == payload.email).first():
    raise HTTPException(status_code=400, detail="Email already registered")
  
  user = User(email=payload.email, hashed_password=hash_password(payload.password))
  db.add(user)
  db.commit()
  db.refresh(user)
  
  return {"message": "User registered successfully", "id": str(user.id)}

@router.post("/login", response_model=TokenResponse, status_code=200)
def login(payload: UserLogin, db: Session = Depends(get_db)):
  
  user = db.query(User).filter(User.email == payload.email).first()
  
  if not user or not verify_password(payload.password, user.hashed_password):
    raise HTTPException(status_code=401, detail="Invalid credentials")
  
  access = create_access_token(str(user.id))
  refresh = create_refresh_token(str(user.id))
  user.refresh_token = refresh
  db.commit()
  
  return {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}

@router.post("/refresh", response_model=TokenResponse, status_code=200)
def refresh_token(payload: RefreshRequest, db: Session = Depends(get_db)):
  
  user_id = verify_token(payload.refresh_token, "refresh")
  
  user = db.query(User).filter(User.id == user_id).first()
  
  if not user or user.refresh_token != payload.refresh_token:
    raise HTTPException(status_code=401, detail="Refresh token revoked or invalid")
  
  access = create_access_token(str(user.id))
  refresh = create_refresh_token(str(user.id))
  user.refresh_token = refresh
  db.commit()
  
  return {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}

@router.post("/logout", status_code=200)
def logout(payload: RefreshRequest, db: Session = Depends(get_db)):
  
  user_id = verify_token(payload.refresh_token, "refresh")
  
  user = db.query(User).filter(User.id == user_id).first()
  
  if not user or user.refresh_token != payload.refresh_token:
    raise HTTPException(status_code=401, detail="Refresh token revoked or invalid")
  
  user.refresh_token = None
  db.commit()
  
  return {"message": "Logged out successfully"}

# OAuth() reads GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET from env automatically
oauth = OAuth()
oauth.register(
  name="google",
  server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
  client_kwargs={"scope": "openid email profile"},
  client_id=os.getenv("GOOGLE_CLIENT_ID"),
  client_secret=os.getenv("GOOGLE_CLIENT_SECRET")
)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

@router.get("/google/login")
async def google_login(request: Request):
  """Redirects user to Google's OAuth consent screen.
  """
  redirect_uri = request.url_for("google_callback")
  return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/google/callback", name="google_callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
  """Handles Google's redirect, upserts user, issues JWT token, and redirects to frontend with tokens.
  """
  try:
    token = await oauth.google.authorize_access_token(request)
  except OAuthError:
    raise HTTPException(status_code=400, detail="Google authentication failed")
  
  user_info = token.get("userinfo")
  if not user_info:
    raise HTTPException(status_code=400, detail="Failed to retrieve user info from Google")
  
  google_id = user_info["sub"]
  email = user_info["email"]
  
  # Check if user with this Google ID already exists
  user = db.query(User).filter(User.google_id == google_id).first()
  
  if not user:
    # If not, create a new user
    user = User(email=email, google_id=google_id, hashed_password=None)
    db.add(user)
    db.commit()
    db.refresh(user)
  
  # Create tokens for the user
  access = create_access_token(str(user.id))
  refresh = create_refresh_token(str(user.id))
  
  # Save refresh token in DB
  user.refresh_token = refresh
  db.commit()
  
  # Redirect to frontend with tokens as query params (or you can set cookies instead)
  redirect_url = f"{FRONTEND_URL}/oauth-callback?access_token={access}&refresh_token={refresh}"
  return RedirectResponse(url=redirect_url)