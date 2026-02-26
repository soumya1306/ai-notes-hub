from datetime import datetime, timedelta, timezone
import bcrypt
import jwt
from jwt.exceptions import InvalidTokenError
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
import os

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-please-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def hash_password(password: str) -> str:
  return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
  
def verify_password(plain_password: str, hashed_password: str) -> bool:
  return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
  
def create_token(data: dict, expires_delta: timedelta) -> str:
  to_encode = data.copy()
  to_encode["exp"] = datetime.now(timezone.utc) + expires_delta
  return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
  
def create_access_token(user_id: str) -> str:
  return create_token({"sub": user_id, "type": "access"}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))

def create_refresh_token(user_id: str) -> str:
  return create_token({"sub": user_id, "type": "refresh"}, timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))

def verify_token(token: str, token_type: str) -> str:
  try:
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    if payload.get("type") != token_type:
      raise HTTPException(status_code=401, detail="Invalid token type")
    return payload["sub"]
  except InvalidTokenError:
    raise HTTPException(status_code=401, detail="Invalid or expired token")
  
def get_current_user_id(token: str = Depends(oauth2_scheme)) -> str:
  return verify_token(token, "access")