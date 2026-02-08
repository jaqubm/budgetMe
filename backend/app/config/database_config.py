"""Database configuration."""

from urllib.parse import quote_plus
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class DatabaseConfig(BaseSettings):
    """Database configuration for Azure SQL."""
    
    server: str = Field(default="localhost")
    port: int = Field(default=1433)
    database: str = Field(default="budgetme")
    username: str = Field(default="sa")
    password: str = Field(default="YourStrong@Passw0rd")
    driver: str = Field(default="ODBC Driver 18 for SQL Server")
    encrypt: bool = Field(default=True)
    trust_server_certificate: bool = Field(default=True)
    connection_timeout: int = Field(default=30)
    
    model_config = SettingsConfigDict(env_prefix="DATABASE_", env_file=".env", extra="ignore")
    
    def get_odbc_connection_string(self, database: str | None = None) -> str:
        """
        Generate ODBC connection string.
        
        Args:
            database: Database name to connect to. If None, uses the configured database.
        
        Returns:
            ODBC connection string
        """
        db_name = database if database is not None else self.database
        return (
            f"DRIVER={{{self.driver}}};"
            f"SERVER={self.server},{self.port};"
            f"UID={self.username};"
            f"PWD={self.password};"
            f"TrustServerCertificate={'yes' if self.trust_server_certificate else 'no'};"
            f"Database={db_name}"
        )
    
    def get_sqlalchemy_url(self) -> str:
        """Generate SQLAlchemy connection URL for Azure SQL."""
        conn_str = self.get_odbc_connection_string()
        return f"mssql+pyodbc:///?odbc_connect={quote_plus(conn_str)}"
