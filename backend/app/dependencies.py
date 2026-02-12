"""Application dependencies for FastAPI dependency injection."""

from fastapi import Depends
from sqlmodel import Session

from app.database import get_session
from app.domain.health.repository import HealthRepository


def get_health_repository(session: Session = Depends(get_session)) -> HealthRepository:
    """
    Dependency function to get HealthRepository instance.
    
    Args:
        session: Database session from dependency injection
        
    Returns:
        HealthRepository: Repository instance
    """
    return HealthRepository(session)
