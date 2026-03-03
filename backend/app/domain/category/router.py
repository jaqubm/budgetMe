"""Category domain router."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_category_repository, get_current_user_id
from app.domain.category.repository import CategoryRepository
from app.domain.category.schema import BudgetDateResponse, CategoryResponse, CategoryUpdate
from app.exceptions import CategoryNotFoundError, UnauthorizedError
from app.models.category import CategoryType


class CategoryRouter:
    """Router for category endpoints."""

    def __init__(self, path: str = "/category"):
        self.__path = path

    def create_router(self) -> APIRouter:
        """Create and configure the category router."""
        router = APIRouter(prefix=self.__path, tags=["category"])

        @router.get("", response_model=list[CategoryResponse], status_code=status.HTTP_200_OK)
        async def get_categories(
            category_type: Optional[CategoryType] = None,
            user_id: str = Depends(get_current_user_id),
            repository: CategoryRepository = Depends(get_category_repository),
        ):
            """
            Return all categories created by the user, optionally filtered by type
            (income | expense | saving).
            """
            return repository.get_categories(user_id, category_type)

        @router.get(
            "/{category_id}/budget-dates",
            response_model=list[BudgetDateResponse],
            status_code=status.HTTP_200_OK,
        )
        async def get_budget_dates(
            category_id: int,
            user_id: str = Depends(get_current_user_id),
            repository: CategoryRepository = Depends(get_category_repository),
        ):
            """
            Return distinct year/month pairs in which the given category has budget entries.
            Useful for navigating to the relevant budget views.
            """
            try:
                return repository.get_budget_dates(user_id, category_id)
            except CategoryNotFoundError as e:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
            except UnauthorizedError as e:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

        @router.patch(
            "/{category_id}",
            response_model=CategoryResponse,
            status_code=status.HTTP_200_OK,
        )
        async def update_category(
            category_id: int,
            data: CategoryUpdate,
            user_id: str = Depends(get_current_user_id),
            repository: CategoryRepository = Depends(get_category_repository),
        ):
            """Update the name of an existing category."""
            try:
                return repository.update_category(category_id, user_id, data)
            except CategoryNotFoundError as e:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
            except UnauthorizedError as e:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

        @router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
        async def delete_category(
            category_id: int,
            user_id: str = Depends(get_current_user_id),
            repository: CategoryRepository = Depends(get_category_repository),
        ):
            """
            Delete a category.
            All budget entries linked to this category are removed automatically (cascade).
            """
            try:
                repository.delete_category(category_id, user_id)
            except CategoryNotFoundError as e:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
            except UnauthorizedError as e:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

        return router
