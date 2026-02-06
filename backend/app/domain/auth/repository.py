from datetime import datetime, timedelta
from logging import Logger
from typing import Dict

from authlib.integrations.starlette_client import OAuth
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
from cryptography.fernet import Fernet
import base64
import secrets

from app.config.auth_config import AuthConfig
from app.domain.auth.schema import UserInfo, TokenPayload


class AuthRepository:
    """Repository for authentication operations using cryptography library"""
    
    def __init__(self, auth_config: AuthConfig, oauth: OAuth, logger: Logger):
        self.__auth_config = auth_config
        self.__oauth = oauth
        self.__logger = logger
        
        # Derive a key from the JWT secret for Fernet encryption
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=auth_config.encryption_salt.encode(),
            iterations=auth_config.kdf_iterations,
            backend=default_backend()
        )
        key = base64.urlsafe_b64encode(kdf.derive(self.__auth_config.jwt_secret_key.encode()))
        self.__cipher = Fernet(key)
    
    def create_access_token(self, user_info: UserInfo) -> str:
        """Create an encrypted JWT-like token using cryptography library"""
        expire = datetime.utcnow() + timedelta(minutes=self.__auth_config.jwt_access_token_expire_minutes)
        
        payload = TokenPayload(
            sub=user_info.email,
            email=user_info.email,
            name=user_info.name,
            picture=user_info.picture,
            exp=int(expire.timestamp())
        )
        
        # Encrypt the payload
        token_bytes = self.__cipher.encrypt(payload.model_dump_json().encode())
        token = base64.urlsafe_b64encode(token_bytes).decode()
        
        self.__logger.info(f"Created access token for user: {user_info.email}")
        return token
    
    def verify_token(self, token: str) -> TokenPayload:
        """Verify and decrypt token"""
        try:
            # Decode and decrypt
            token_bytes = base64.urlsafe_b64decode(token.encode())
            decrypted = self.__cipher.decrypt(token_bytes)
            payload = TokenPayload.model_validate_json(decrypted)
            
            # Check expiration
            if payload.exp < int(datetime.utcnow().timestamp()):
                raise ValueError("Token expired")
            
            return payload
        except Exception as e:
            self.__logger.error(f"Token verification failed: {str(e)}")
            raise
    
    async def get_oauth_client(self):
        """Get the OAuth client for Google"""
        return self.__oauth.google
    
    def parse_user_info(self, oauth_token: Dict) -> UserInfo:
        """Parse user info from OAuth token"""
        user_info = oauth_token.get('userinfo')
        if not user_info:
            raise ValueError("Failed to get user info from OAuth token")
        
        return UserInfo(
            email=user_info.get("email"),
            name=user_info.get("name"),
            picture=user_info.get("picture")
        )
