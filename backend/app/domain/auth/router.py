from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2AuthorizationCodeBearer

from app.domain.auth.repository import AuthRepository
from app.domain.auth.schema import VerifyTokenResponse, UserInfo
from app.exceptions import InvalidTokenError, TokenVerificationError


class AuthRouter:
    """Router for authentication endpoints using Google OAuth tokens"""
    
    def __init__(self, path: str):
        self.__path: str = path
        self.__repository = AuthRepository()
    
    def create_router(self) -> APIRouter:
        """Create and configure the authentication router"""
        # OAuth2 scheme for Swagger UI
        oauth2_scheme = OAuth2AuthorizationCodeBearer(
            authorizationUrl="https://accounts.google.com/o/oauth2/v2/auth",
            tokenUrl="https://oauth2.googleapis.com/token",
            scopes={"openid": "OpenID", "email": "Email", "profile": "Profile"}
        )
        
        router = APIRouter(prefix=self.__path, tags=["auth"])
        
        @router.post("/verify", response_model=VerifyTokenResponse)
        async def verify_token(token: str = Depends(oauth2_scheme)):
            """Verify Google ID token passed as Bearer token in Authorization header"""
            try:
                user_info = await self.__repository.verify_google_token(token)
                return VerifyTokenResponse(valid=True, user=user_info)
            except InvalidTokenError:
                return VerifyTokenResponse(valid=False, user=None)
            except TokenVerificationError as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @router.get("/me", response_model=UserInfo)
        async def get_current_user(token: str = Depends(oauth2_scheme)):
            """Get current authenticated user information from Google token"""
            try:
                user_info = await self.__repository.verify_google_token(token)
                return user_info
            except (InvalidTokenError, TokenVerificationError) as e:
                raise HTTPException(status_code=401, detail=str(e))
        
        return router
