from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class AuthConfig(BaseSettings):
    """Configuration for authentication in the budgetMe backend server."""
    # Google OAuth Configuration
    google_client_id: str = Field(default="", validation_alias="GOOGLE_CLIENT_ID")
    google_client_secret: str = Field(default="", validation_alias="GOOGLE_CLIENT_SECRET")
    oauth_redirect_uri: str = Field(default="http://localhost:8000/auth/callback", validation_alias="OAUTH_REDIRECT_URI")
    
    # Session Configuration
    session_secret_key: str = Field(default="your-session-secret-key-change-in-production", validation_alias="SESSION_SECRET_KEY")
    
    # JWT Token Configuration
    jwt_secret_key: str = Field(default="your-secret-key-change-in-production", validation_alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", validation_alias="JWT_ALGORITHM")
    jwt_access_token_expire_minutes: int = Field(default=60 * 24 * 7, validation_alias="JWT_ACCESS_TOKEN_EXPIRE_MINUTES")  # 7 days
    
    # Encryption Configuration
    encryption_salt: str = Field(default="budgetme_default_salt_change_in_production", validation_alias="ENCRYPTION_SALT")
    kdf_iterations: int = Field(default=100000, validation_alias="KDF_ITERATIONS")
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")