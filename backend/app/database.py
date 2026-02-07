"""Database utility functions."""

from sqlmodel import create_engine, Session
from app.config.database_config import DatabaseConfig


def get_engine():
    """Get SQLAlchemy engine for the database."""
    db_config = DatabaseConfig()
    return create_engine(
        db_config.get_sqlalchemy_url(),
        echo=True,  # Set to False in production
    )


def get_session():
    """Get a database session."""
    engine = get_engine()
    with Session(engine) as session:
        yield session
