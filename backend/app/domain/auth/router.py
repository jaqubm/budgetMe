from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.security import OAuth2AuthorizationCodeBearer

from app.config.auth import AuthConfig
from app.domain.auth.repository import AuthRepository
from app.domain.auth.schema import VerifyTokenRequest, VerifyTokenResponse, UserInfo
from app.exceptions import OAuthError, InvalidTokenError, TokenVerificationError
from authlib.integrations.starlette_client import OAuth


class AuthRouter:
    """Router for authentication endpoints using Google OAuth tokens"""
    
    def __init__(self, path: str, auth_config: AuthConfig):
        self.__path: str = path
        self.__auth_config = auth_config
        
        # Initialize OAuth
        oauth = OAuth()
        oauth.register(
            name='google',
            client_id=auth_config.google_client_id,
            client_secret=auth_config.google_client_secret,
            server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
            client_kwargs={'scope': 'openid email profile'}
        )
        
        # Initialize repository
        self.__repository = AuthRepository(auth_config, oauth)
    
    def __get_token_from_header(self, request: Request) -> str:
        """Extract token from Authorization header"""
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Not authenticated")
        return auth_header.split(" ")[1]
    
    def create_router(self) -> APIRouter:
        """Create and configure the authentication router"""
        # OAuth2 scheme for Swagger UI
        oauth2_scheme = OAuth2AuthorizationCodeBearer(
            authorizationUrl="https://accounts.google.com/o/oauth2/v2/auth",
            tokenUrl="https://oauth2.googleapis.com/token",
            scopes={"openid": "OpenID", "email": "Email", "profile": "Profile"}
        )
        
        router = APIRouter(prefix=self.__path, tags=["auth"])
        
        @router.get("/login")
        async def login(request: Request):
            """Redirect to Google OAuth login page"""
            try:
                oauth_client = await self.__repository.get_oauth_client()
                redirect_uri = self.__auth_config.oauth_redirect_uri
                return await oauth_client.authorize_redirect(request, redirect_uri)
            except Exception as e:
                raise OAuthError(f"Failed to initiate login: {str(e)}")
        
        @router.post("/verify", response_model=VerifyTokenResponse)
        async def verify_token(token_request: VerifyTokenRequest):
            """Verify Google ID token and return user info"""
            try:
                user_info = await self.__repository.verify_google_token(token_request.token)
                return VerifyTokenResponse(valid=True, user=user_info)
            except InvalidTokenError:
                return VerifyTokenResponse(valid=False, user=None)
            except TokenVerificationError as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @router.get("/me", response_model=UserInfo)
        async def get_current_user(request: Request, token: str = Depends(oauth2_scheme)):
            """Get current authenticated user information from Google token"""
            try:
                # If token comes from Depends, use it; otherwise get from header
                if not token:
                    token = self.__get_token_from_header(request)
                user_info = await self.__repository.verify_google_token(token)
                return user_info
            except (InvalidTokenError, TokenVerificationError) as e:
                raise HTTPException(status_code=401, detail=str(e))
        
        @router.post("/logout")
        async def logout():
            """Logout endpoint (client should delete token)"""
            return {"message": "Logged out successfully"}
        
        return router
