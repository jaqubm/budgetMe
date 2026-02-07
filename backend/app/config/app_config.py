from functools import lru_cache

from pydantic_settings import BaseSettings

from app.config.server_config import ServerConfig
from app.config.auth_config import AuthConfig
from app.config.database_config import DatabaseConfig

class AppConfig(BaseSettings):
    """Main configuration for the budgetMe backend server."""
    server_config: ServerConfig = ServerConfig()
    auth_config: AuthConfig = AuthConfig()
    database_config: DatabaseConfig = DatabaseConfig()
  
@lru_cache
def get_app_config() -> AppConfig:
    """Get the main application configuration, cached for performance."""
    return AppConfig()