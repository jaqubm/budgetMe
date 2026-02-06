from pydantic import BaseModel, EmailStr


class UserInfo(BaseModel):
    """User information from Google OAuth"""
    email: EmailStr
    name: str
    picture: str | None = None


class VerifyTokenRequest(BaseModel):
    """Request model for token verification"""
    token: str


class VerifyTokenResponse(BaseModel):
    """Response model for token verification"""
    valid: bool
    user: UserInfo | None = None
