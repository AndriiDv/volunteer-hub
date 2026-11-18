from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.core.config import settings
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, GoogleAuthRequest, UserOut, Token
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )
    
    is_verified = True if user_in.role == "admin" else False
    
    user = User(
        email=user_in.email,
        password_hash=hash_password(user_in.password),
        full_name=user_in.full_name or user_in.email.split("@")[0],
        role=user_in.role or "volunteer",
        unit_name=user_in.unit_name if user_in.role == "military" else None,
        is_verified=is_verified,
        points=0
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id, role=user.role)
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "unit_name": user.unit_name,
        "is_verified": user.is_verified,
        "points": user.points,
        "created_at": user.created_at,
        "access_token": token,
        "token_type": "bearer",
    }

@router.post("/login", response_model=Token)
async def login(
    request: Request,
    db: Session = Depends(get_db)
):
    content_type = request.headers.get("content-type", "")
    email = None
    password = None

    if "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
        form = await request.form()
        email = form.get("username") or form.get("email")
        password = form.get("password")
    else:
        try:
            body = await request.json()
            if isinstance(body, dict):
                email = body.get("email") or body.get("username")
                password = body.get("password")
        except Exception:
            pass

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Email and password are required."
        )

    user = db.query(User).filter(User.email == str(email).strip()).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(subject=user.id, role=user.role)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/google", response_model=Token)
def sign_in_with_google(
    auth_in: GoogleAuthRequest,
    db: Session = Depends(get_db)
):
    """
    Verify Google ID token and authenticate or register user.
    """
    token_str = auth_in.id_token or auth_in.credential or auth_in.token
    if not token_str:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="id_token or credential is required."
        )

    try:
        id_info = id_token.verify_oauth2_token(
            token_str,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google ID token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = id_info.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google token does not contain an email address."
        )

    full_name = id_info.get("name") or email.split("@")[0]

    # Find or create user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        chosen_role = auth_in.role if auth_in.role in ["volunteer", "military"] else "volunteer"
        user = User(
            email=email,
            password_hash=None,
            full_name=full_name,
            role=chosen_role,
            unit_name=None,
            is_verified=False,
            points=0
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(subject=user.id, role=user.role)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user
