"""Category domain schemas."""

from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field

from app.models.category import CategoryType

PositiveId = Annotated[int, Field(gt=0, description="Database primary key")]
Name = Annotated[str, Field(min_length=1, max_length=255, description="Non-empty name")]
Year = Annotated[int, Field(ge=2000, le=2100, description="Calendar year (2000\u20132100)")]
Month = Annotated[int, Field(ge=1, le=12, description="Calendar month (1\u201312)")]


class CategoryResponse(BaseModel):
    """Response schema for a category."""

    id: PositiveId
    name: Name
    type: CategoryType


class CategoryUpdate(BaseModel):
    """Schema for updating a category name."""

    model_config = ConfigDict(str_strip_whitespace=True)

    name: Name


class BudgetDateResponse(BaseModel):
    """Distinct year/month pair in which a category has budget entries."""

    year: Year
    month: Month
