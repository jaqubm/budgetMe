"""Health check repository."""

from sqlalchemy import text
from sqlmodel import Session

from app.database import get_engine


class HealthRepository:
    """Repository for health check operations"""
    
    @staticmethod
    def check_database_connection() -> tuple[bool, str]:
        """
        Check if database connection is healthy.
        
        Returns:
            tuple: (is_healthy, message)
        """
        try:
            engine = get_engine()
            with Session(engine) as session:
                result = session.exec(text("SELECT 1")).first()
                if result:
                    return True, "Database connection is healthy"
                return False, "Database query returned no result"
        except Exception as e:
            return False, f"Database connection failed: {str(e)}"
