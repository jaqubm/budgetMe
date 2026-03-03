from typing import Annotated

from pydantic import AnyHttpUrl, BaseModel, EmailStr, Field


class UserInfo(BaseModel):
    """User information from Google OAuth"""

    email: EmailStr
    name: Annotated[str, Field(max_length=255, description="Display name from Google")]
    picture: AnyHttpUrl | None = None


class VerifyTokenResponse(BaseModel):
    """Response model for token verification"""

    valid: bool
    user: UserInfo | None = None
