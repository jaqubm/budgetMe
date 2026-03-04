"""Budget model."""

from typing import Optional

from sqlalchemy import Column, ForeignKey, Integer
from sqlmodel import Field

from app.models.base import BaseSQLModel


class Budget(BaseSQLModel, table=True):
    """Budget table for storing user budget."""

    __tablename__ = "budget"

    id: int = Field(primary_key=True, sa_column_kwargs={"autoincrement": True})
    user_id: str = Field(index=True, max_length=255)
    name: str = Field(max_length=255)
    year: int = Field(index=True)
    month: int = Field(index=True)
    value: float = Field(default=0.0)
    reoccur: bool = Field(default=False, index=True)

    cloned_from_id: Optional[int] = Field(
        default=None,
        sa_column=Column(
            Integer,
            ForeignKey("budget.id", ondelete="SET NULL"),
            index=True,
            nullable=True,
        ),
    )

    category_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("category.id", ondelete="CASCADE"),
            index=True,
            nullable=False,
        )
    )
