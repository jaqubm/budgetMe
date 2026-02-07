"""Database models base configuration."""

from sqlmodel import SQLModel

# Import all models here for Alembic autogenerate
from app.models.budget import Budget

# This is the metadata that Alembic will use for autogenerate
metadata = SQLModel.metadata

__all__ = ["Budget", "metadata"]
