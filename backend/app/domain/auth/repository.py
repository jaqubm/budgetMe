import httpx

from app.domain.auth.schema import UserInfo
from app.exceptions import InvalidTokenError, TokenVerificationError


class AuthRepository:
    """Repository for authentication operations using Google OAuth tokens"""

    async def verify_google_token(self, token: str) -> UserInfo:
        """Verify a Google access token via the userinfo endpoint and return user info."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    headers={"Authorization": f"Bearer {token}"},
                )

            if response.status_code != 200:
                raise InvalidTokenError("Invalid access token")

            data = response.json()

            return UserInfo(
                email=data["email"],
                name=data.get("name", ""),
                picture=data.get("picture"),
            )

        except (InvalidTokenError, TokenVerificationError):
            raise
        except Exception as e:
            raise TokenVerificationError(f"Token verification failed: {str(e)}")
