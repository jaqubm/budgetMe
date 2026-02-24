from pydantic import BaseModel, EmailStr


class UserInfo(BaseModel):
    """User information from Google OAuth"""
    email: EmailStr
    name: str
    picture: str | None = None


class VerifyTokenResponse(BaseModel):
    """Response model for token verification"""
    valid: bool
    user: UserInfo | None = None
