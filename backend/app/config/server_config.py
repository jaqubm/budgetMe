from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class ServerConfig(BaseSettings):
    host: str = Field(default="0.0.0.0")
    port: int = Field(default=8000)
    root_path: str = Field(default="/api")
    log_level: str = Field(default="info")
    debug_mode: bool = Field(default=True)
    cors_origins: str = Field(default="http://localhost:5173,http://localhost:3000")
    
    model_config = SettingsConfigDict(env_prefix="SERVER_", env_file=".env", extra="ignore")