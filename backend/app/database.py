"""Database connection and session management."""

from typing import Generator
from functools import lru_cache

from sqlalchemy import Engine
from sqlmodel import Session, create_engine

from app.config.app import get_app_config


@lru_cache(maxsize=1)
def get_engine() -> Engine:
    """
    Get SQLAlchemy engine (cached singleton).
    
    Returns:
        Engine: SQLAlchemy engine instance
    """
    app_config = get_app_config()
    return create_engine(
        app_config.database_config.get_sqlalchemy_url(),
        future=True,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
    )


def get_session() -> Generator[Session, None, None]:
    """
    Get database session for dependency injection.
    
    Creates a new session for each request and ensures proper cleanup.
    Use with FastAPI's Depends().
    
    Yields:
        Session: Database session
    """
    engine = get_engine()
    with Session(engine) as session:
        try:
            yield session
        finally:
            session.close()
