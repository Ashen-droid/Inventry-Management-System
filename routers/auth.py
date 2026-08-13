"""Auth router: Login + Register."""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional

from database import get_db, User, ActivityLog
from services.auth_service import (
    hash_password, verify_password, create_access_token, get_current_user
)

router = APIRouter(prefix="/auth", tags=["Auth"])


# ── Schemas ──────────────────────────────────────────────
class RegisterRequest(BaseModel):
    username: str
    password: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = "employee"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    username: str
    role: str
    full_name: Optional[str]


# ── Routes ───────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    # Log activity
    log = ActivityLog(user_id=user.user_id, action="LOGIN",
                      details=f"User '{user.username}' logged in")
    db.add(log)
    db.commit()

    token = create_access_token({"user_id": user.user_id, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.user_id,
        "username": user.username,
        "role": user.role,
        "full_name": user.full_name,
    }


@router.post("/register", status_code=201)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    # Only allow if no users exist OR current user is admin
    existing = db.query(User).filter(User.username == req.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        username=req.username,
        password_hash=hash_password(req.password),
        full_name=req.full_name,
        email=req.email,
        role=req.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "User created", "user_id": user.user_id}


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "user_id": current_user.user_id,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "email": current_user.email,
    }
