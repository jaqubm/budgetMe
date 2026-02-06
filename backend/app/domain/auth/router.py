from logging import Logger
from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import JSONResponse

from app.config.auth_config import AuthConfig
from app.domain.auth.repository import AuthRepository
from app.domain.auth.schema import TokenResponse, CurrentUser
from authlib.integrations.starlette_client import OAuth


class AuthRouter:
    """Router for authentication endpoints using domain-driven design"""
    
    def __init__(self, path: str, logger: Logger, auth_config: AuthConfig):
        self.__path: str = path
        self.__logger: Logger = logger
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
        self.__repository = AuthRepository(auth_config, oauth, logger)
    
    def __get_token_from_header(self, request: Request) -> str:
        """Extract token from Authorization header"""
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Not authenticated")
        return auth_header.split(" ")[1]
    
    def create_router(self) -> APIRouter:
        """Create and configure the authentication router"""
        self.__logger.info("Creating Auth Router with DDD pattern")
        self.__logger.info(f"Auth Router Path: {self.__path}")
        
        router = APIRouter(prefix=self.__path, tags=["auth"])
        
        @router.get("/login")
        async def login(request: Request):
            """Initiate Google OAuth login flow"""
            try:
                oauth_client = await self.__repository.get_oauth_client()
                redirect_uri = request.url_for('auth_callback')
                return await oauth_client.authorize_redirect(request, redirect_uri)
            except Exception as e:
                self.__logger.error(f"Login initiation failed: {str(e)}")
                raise HTTPException(status_code=500, detail="Failed to initiate login")
        
        @router.get("/callback", response_model=TokenResponse)
        async def auth_callback(request: Request):
            """Handle Google OAuth callback and return JWT token"""
            try:
                # Get OAuth token from Google
                oauth_client = await self.__repository.get_oauth_client()
                token = await oauth_client.authorize_access_token(request)
                
                # Parse user info
                user_info = self.__repository.parse_user_info(token)
                
                # Create access token
                access_token = self.__repository.create_access_token(user_info)
                
                self.__logger.info(f"User authenticated successfully: {user_info.email}")
                
                return TokenResponse(
                    access_token=access_token,
                    token_type="bearer",
                    user=user_info
                )
                
            except ValueError as e:
                self.__logger.error(f"Authentication validation error: {str(e)}")
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                self.__logger.error(f"Authentication error: {str(e)}")
                raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")
        
        @router.post("/logout")
        async def logout():
            """Logout endpoint (client-side token deletion)"""
            return {"message": "Logged out successfully"}
        
        @router.get("/me", response_model=CurrentUser)
        async def get_current_user(request: Request):
            """Get current authenticated user information from token"""
            try:
                token = self.__get_token_from_header(request)
                payload = self.__repository.verify_token(token)
                
                return CurrentUser(
                    email=payload.email,
                    name=payload.name,
                    picture=payload.picture
                )
            except ValueError as e:
                raise HTTPException(status_code=401, detail=str(e))
            except Exception as e:
                self.__logger.error(f"Token validation failed: {str(e)}")
                raise HTTPException(status_code=401, detail="Invalid token")
        
        return router
