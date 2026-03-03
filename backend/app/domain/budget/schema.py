"""Budget domain schemas."""

from typing import Optional

from pydantic import BaseModel

from app.models.category import CategoryType


class CategoryInfo(BaseModel):
    """Category information embedded in budget responses."""

    id: int
    name: str
    type: CategoryType


class BudgetCreate(BaseModel):
    """Schema for creating a new budget entry."""

    name: str
    year: int
    month: int
    value: float = 0.0
    category_name: str
    category_type: CategoryType


class BudgetUpdate(BaseModel):
    """Schema for updating an existing budget entry. All fields are optional."""

    name: Optional[str] = None
    year: Optional[int] = None
    month: Optional[int] = None
    value: Optional[float] = None
    category_name: Optional[str] = None
    category_type: Optional[CategoryType] = None


class BudgetResponse(BaseModel):
    """Response schema for a budget entry."""

    id: int
    name: str
    year: int
    month: int
    value: float
    category: CategoryInfo
