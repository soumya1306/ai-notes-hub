from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import UserCreate, UserLogin, TokenResponse, RefreshRequest
from auth import hash_password, verify_password, create_access_token, create_refresh_token,verify_token

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
  
  if not user_id:
    raise HTTPException(status_code=401, detail="Invalid refresh token")
  
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
  
  if not user_id:
    raise HTTPException(status_code=401, detail="Invalid refresh token")
  
  user = db.query(User).filter(User.id == user_id).first()
  
  if not user or user.refresh_token != payload.refresh_token:
    raise HTTPException(status_code=401, detail="Refresh token revoked or invalid")
  
  user.refresh_token = None
  db.commit()
  
  return {"message": "Logged out successfully"}