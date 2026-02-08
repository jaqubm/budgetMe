"""Database utility functions."""

from functools import lru_cache
from typing import Generator
from sqlalchemy import Engine
from sqlmodel import create_engine, Session
from app.config.database_config import DatabaseConfig
from backend.app.config.app_config import get_app_config


@lru_cache(maxsize=1)
def get_engine() -> Engine:
    """Get SQLAlchemy engine for the database."""
    app_config = get_app_config()
    return create_engine(
        app_config.database_config.get_sqlalchemy_url(),
        future=True,
        pool_pre_ping=True
    )


def get_session() -> Generator[Session, None, None]:
    """Get a database session."""
    with Session(get_engine()) as session:
        yield session
