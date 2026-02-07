"""Budget model."""

from datetime import date as date_type
from typing import Optional
from sqlmodel import Field, SQLModel


class Budget(SQLModel, table=True):
    """Budget table for storing user budgets."""
    
    __tablename__ = "budgets"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True, max_length=255)
    name: str = Field(max_length=255)
    date: date_type = Field(index=True)  # Will store year and month (day will be 01)
