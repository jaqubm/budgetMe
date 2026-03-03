"""Budget domain schemas."""

from typing import Annotated, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.category import CategoryType

Year = Annotated[int, Field(ge=2000, le=2100, description="Calendar year (2000–2100)")]
Month = Annotated[int, Field(ge=1, le=12, description="Calendar month (1–12)")]
PositiveId = Annotated[int, Field(gt=0, description="Database primary key")]
Name = Annotated[str, Field(min_length=1, max_length=255, description="Non-empty name")]


class CategoryInfo(BaseModel):
    """Category information embedded in budget responses."""

    id: PositiveId
    name: Name
    type: CategoryType


class BudgetCreate(BaseModel):
    """Schema for creating a new budget entry."""

    model_config = ConfigDict(str_strip_whitespace=True)

    name: Name
    year: Year
    month: Month
    value: Annotated[float, Field(ge=0.0, description="Budget value (non-negative)")] = 0.0
    category_name: Name
    category_type: CategoryType


class BudgetUpdate(BaseModel):
    """Schema for updating an existing budget entry. All fields are optional."""

    model_config = ConfigDict(str_strip_whitespace=True)

    name: Optional[Name] = None
    year: Optional[Year] = None
    month: Optional[Month] = None
    value: Optional[Annotated[float, Field(ge=0.0, description="Budget value (non-negative)")]] = None
    category_name: Optional[Name] = None
    category_type: Optional[CategoryType] = None


class BudgetResponse(BaseModel):
    """Response schema for a budget entry."""

    id: PositiveId
    name: Name
    year: Year
    month: Month
    value: float
    category: CategoryInfo
