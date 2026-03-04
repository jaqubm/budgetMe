"""Budget domain router."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.dependencies import get_budget_repository, get_current_user_id
from app.domain.budget.repository import BudgetRepository
from app.domain.budget.schema import BudgetCloneRequest, BudgetCreate, BudgetResponse, BudgetUpdate
from app.exceptions import BudgetNotFoundError, UnauthorizedError
from app.models.category import CategoryType

class BudgetRouter:
    """Router for budget endpoints."""

    def __init__(self, path: str = "/budget"):
        self.__path = path

    def create_router(self) -> APIRouter:
        """Create and configure the budget router."""
        router = APIRouter(prefix=self.__path, tags=["budget"])

        @router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
        async def create_budget(
            data: BudgetCreate,
            user_id: str = Depends(get_current_user_id),
            repository: BudgetRepository = Depends(get_budget_repository),
        ):
            """
            Create a new budget entry.

            The category identified by (category_name, category_type) is looked up for
            the current user and created automatically if it does not yet exist.

            Set `reoccur` to `true` to have this budget cloned automatically into
            subsequent months via the `/budget/clone` endpoint.

            Accepted values for `category_type`: `income`, `expense`, `saving`.
            """
            return repository.create_budget(user_id, data)

        @router.get("", response_model=list[BudgetResponse], status_code=status.HTTP_200_OK)
        async def get_budgets(
            year: int = Query(..., ge=2000, le=2100, description="Calendar year (2000–2100)"),
            month: int = Query(..., ge=1, le=12, description="Calendar month (1–12)"),
            category_type: Optional[CategoryType] = None,
            user_id: str = Depends(get_current_user_id),
            repository: BudgetRepository = Depends(get_budget_repository),
        ):
            """
            Return all budgets for the authenticated user in the given year/month.

            Optionally filter by `category_type`. Accepted values: `income`, `expense`, `saving`.
            """
            return repository.get_budgets(user_id, year, month, category_type)

        @router.post("/clone", response_model=list[BudgetResponse], status_code=status.HTTP_200_OK)
        async def clone_reoccurring_budgets(
            data: BudgetCloneRequest,
            user_id: str = Depends(get_current_user_id),
            repository: BudgetRepository = Depends(get_budget_repository),
        ):
            """
            Clone all reoccurring budgets from the previous month into the specified year/month.

            The previous month is derived automatically:
            - Target `2026/3` → clones from `2026/2`
            - Target `2026/1` → clones from `2025/12`

            Only budgets with `reoccur=true` are cloned. Budgets in the target month that
            already carry a `cloned_from_id` pointing to a source budget are skipped, so
            calling this endpoint multiple times is safe (idempotent per source budget).

            Returns the list of **newly created** budget entries. An empty array means
            either all reoccurring budgets were already cloned or there are none in the
            previous month.
            """
            return repository.clone_reoccurring_budgets(user_id, data)

        @router.patch("/{budget_id}", response_model=BudgetResponse, status_code=status.HTTP_200_OK)
        async def update_budget(
            budget_id: int,
            data: BudgetUpdate,
            user_id: str = Depends(get_current_user_id),
            repository: BudgetRepository = Depends(get_budget_repository),
        ):
            """
            Update an existing budget entry.

            Only the fields present in the request body are modified.
            If `category_name` or `category_type` is provided, the matching category is
            looked up (or created) for the current user.

            Accepted values for `category_type`: `income`, `expense`, `saving`.
            """
            try:
                return repository.update_budget(budget_id, user_id, data)
            except BudgetNotFoundError as e:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
            except UnauthorizedError as e:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

        @router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
        async def delete_budget(
            budget_id: int,
            user_id: str = Depends(get_current_user_id),
            repository: BudgetRepository = Depends(get_budget_repository),
        ):
            """Delete a budget entry."""
            try:
                repository.delete_budget(budget_id, user_id)
            except BudgetNotFoundError as e:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
            except UnauthorizedError as e:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

        return router
