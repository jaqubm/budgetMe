"""Category model."""

import enum

from sqlmodel import Field

from app.models.base import BaseSQLModel


class CategoryType(str, enum.Enum):
    """Type of a budget category."""
    INCOME = "income"
    EXPENSE = "expense"
    SAVING = "saving"


class Category(BaseSQLModel, table=True):
    """Category table for classifying budget entries."""

    __tablename__ = "category"

    id: int = Field(primary_key=True, sa_column_kwargs={"autoincrement": True})
    user_id: str = Field(index=True, max_length=255)
    name: str = Field(max_length=255)
    type: CategoryType = Field(index=True)
