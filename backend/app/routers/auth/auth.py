from logging import Logger
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from datetime import datetime, timedelta
from jose import jwt
import os


class AuthRouter:
    def __init__(self, path: str, logger: Logger):
        self.__path: str = path
        self.__logger: Logger = logger
        
        # OAuth configuration
        config = Config(environ={
            "GOOGLE_CLIENT_ID": os.getenv("GOOGLE_CLIENT_ID", ""),
            "GOOGLE_CLIENT_SECRET": os.getenv("GOOGLE_CLIENT_SECRET", ""),
        })
        
        self.__oauth = OAuth(config)
        self.__oauth.register(
            name='google',
            server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
            client_kwargs={'scope': 'openid email profile'}
        )
        
        # JWT configuration
        self.__secret_key = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
        self.__algorithm = "HS256"
        self.__access_token_expire_minutes = 60 * 24 * 7  # 7 days
        
    def __create_access_token(self, data: dict) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=self.__access_token_expire_minutes)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.__secret_key, algorithm=self.__algorithm)
        return encoded_jwt
        
    def create_router(self) -> APIRouter:
        self.__logger.info("Creating Auth Router")
        self.__logger.info(f"Auth Router Path: {self.__path}")
        
        router = APIRouter(prefix=self.__path, tags=["auth"])
        
        @router.get("/login")
        async def login(request: Request):
            """Initiate Google OAuth login flow"""
            redirect_uri = request.url_for('auth_callback')
            return await self.__oauth.google.authorize_redirect(request, redirect_uri)
        
        @router.get("/callback")
        async def auth_callback(request: Request):
            """Handle Google OAuth callback"""
            try:
                # Get the OAuth token from Google
                token = await self.__oauth.google.authorize_access_token(request)
                
                # Parse user info from the token
                user_info = token.get('userinfo')
                if not user_info:
                    raise HTTPException(status_code=400, detail="Failed to get user info")
                
                # Create JWT token with user data
                access_token = self.__create_access_token({
                    "sub": user_info.get("email"),
                    "email": user_info.get("email"),
                    "name": user_info.get("name"),
                    "picture": user_info.get("picture"),
                })
                
                self.__logger.info(f"User authenticated: {user_info.get('email')}")
                
                # Return token (you can redirect to frontend with token in URL or set cookie)
                return {
                    "access_token": access_token,
                    "token_type": "bearer",
                    "user": {
                        "email": user_info.get("email"),
                        "name": user_info.get("name"),
                        "picture": user_info.get("picture"),
                    }
                }
                
            except Exception as e:
                self.__logger.error(f"Authentication error: {str(e)}")
                raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")
        
        @router.post("/logout")
        async def logout():
            """Logout endpoint (client should delete token)"""
            return {"message": "Logged out successfully"}
        
        @router.get("/me")
        async def get_current_user(request: Request):
            """Get current user info from JWT token"""
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                raise HTTPException(status_code=401, detail="Not authenticated")
            
            token = auth_header.split(" ")[1]
            try:
                payload = jwt.decode(token, self.__secret_key, algorithms=[self.__algorithm])
                return {
                    "email": payload.get("email"),
                    "name": payload.get("name"),
                    "picture": payload.get("picture"),
                }
            except jwt.ExpiredSignatureError:
                raise HTTPException(status_code=401, detail="Token expired")
            except jwt.JWTError:
                raise HTTPException(status_code=401, detail="Invalid token")
        
        return router

    