from pydantic import BaseModel, EmailStr


class UserInfo(BaseModel):
    """User information from OAuth provider"""
    email: EmailStr
    name: str
    picture: str | None = None


class TokenResponse(BaseModel):
    """Response model for authentication token"""
    access_token: str
    token_type: str = "bearer"
    user: UserInfo


class TokenPayload(BaseModel):
    """JWT token payload structure"""
    sub: EmailStr
    email: EmailStr
    name: str
    picture: str | None = None
    exp: int


class CurrentUser(BaseModel):
    """Current authenticated user"""
    email: EmailStr
    name: str
    picture: str | None = None
