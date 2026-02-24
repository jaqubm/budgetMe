from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class AuthConfig(BaseSettings):
    """Configuration for authentication in the budgetMe backend server."""
    # Google OAuth Configuration
    google_client_id: str = Field(default="", validation_alias="GOOGLE_CLIENT_ID")
    google_client_secret: str = Field(default="", validation_alias="GOOGLE_CLIENT_SECRET")
    
    # Session Configuration
    session_secret_key: str = Field(default="your-session-secret-key-change-in-production", validation_alias="SESSION_SECRET_KEY")
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")