from typing import Dict
import httpx

from authlib.integrations.starlette_client import OAuth

from app.config.auth_config import AuthConfig
from app.domain.auth.schema import UserInfo
from app.exceptions import InvalidTokenError, TokenVerificationError


class AuthRepository:
    """Repository for authentication operations using Google OAuth tokens"""
    
    def __init__(self, auth_config: AuthConfig, oauth: OAuth):
        self.__auth_config = auth_config
        self.__oauth = oauth
    
    async def verify_google_token(self, token: str) -> UserInfo:
        """Verify Google ID token and return user info"""
        try:
            # Verify token with Google's tokeninfo endpoint
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
                )
                
                if response.status_code != 200:
                    raise InvalidTokenError("Invalid token")
                
                token_info = response.json()
                
                # Verify the token is for our app
                if token_info.get("aud") != self.__auth_config.google_client_id:
                    raise InvalidTokenError("Token not issued for this application")
                
                # Extract user info
                user_info = UserInfo(
                    email=token_info.get("email"),
                    name=token_info.get("name"),
                    picture=token_info.get("picture")
                )
                
                return user_info
                
        except (InvalidTokenError, TokenVerificationError):
            raise
        except Exception as e:
            raise TokenVerificationError(f"Token verification failed: {str(e)}")
    
    async def get_oauth_client(self):
        """Get the OAuth client for Google"""
        return self.__oauth.google
