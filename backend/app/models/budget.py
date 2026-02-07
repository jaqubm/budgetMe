"""Budget model."""

from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel

from app.models.base import BaseSQLModel


class Budget(BaseSQLModel, table=True):
    """Budget table for storing user budget."""
    
    __tablename__ = "budget"
    
    id: int = Field(primary_key=True, sa_column_kwargs={"autoincrement": True})
    user_id: str = Field(index=True, max_length=255)
    name: str = Field(max_length=255)
    date: datetime = Field(index=True)
    