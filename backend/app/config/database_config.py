"""Database configuration."""

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class DatabaseConfig(BaseSettings):
    """Database configuration for Azure SQL."""
    
    server: str = Field(default="localhost")
    database: str = Field(default="budgetme")
    username: str = Field(default="sa")
    password: str = Field(default="YourStrong@Passw0rd")
    driver: str = Field(default="ODBC Driver 18 for SQL Server")
    encrypt: bool = Field(default=True)
    trust_server_certificate: bool = Field(default=True)
    connection_timeout: int = Field(default=30)
    
    model_config = SettingsConfigDict(env_prefix="DATABASE_", env_file=".env", extra="ignore")
    
    def get_sqlalchemy_url(self) -> str:
        """Generate SQLAlchemy connection URL for Azure SQL."""
        return (
            f"mssql+pyodbc://{self.username}:{self.password}@{self.server}/"
            f"{self.database}?driver={self.driver.replace(' ', '+')}"
            f"&Encrypt={'yes' if self.encrypt else 'no'}"
            f"&TrustServerCertificate={'yes' if self.trust_server_certificate else 'no'}"
            f"&Connection+Timeout={self.connection_timeout}"
        )
