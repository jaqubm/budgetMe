"""Category domain schemas."""

from pydantic import BaseModel

from app.models.category import CategoryType


class CategoryResponse(BaseModel):
    """Response schema for a category."""

    id: int
    name: str
    type: CategoryType


class CategoryUpdate(BaseModel):
    """Schema for updating a category name."""

    name: str


class BudgetDateResponse(BaseModel):
    """Distinct year/month pair in which a category has budget entries."""

    year: int
    month: int
