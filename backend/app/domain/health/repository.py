"""Health check repository."""

from sqlalchemy import text
from sqlmodel import Session


class HealthRepository:
    """Repository for health check operations"""
    
    def __init__(self, session: Session):
        self.__session = session
    
    def check_database_connection(self) -> tuple[bool, str]:
        """
        Check if database connection is healthy.
        
        Returns:
            tuple: (is_healthy, message)
        """
        try:
            result = self.__session.exec(text("SELECT 1")).first()
            if result:
                return True, "Database connection is healthy"
            return False, "Database query returned no result"
        except Exception as e:
            return False, f"Database connection failed: {str(e)}"
