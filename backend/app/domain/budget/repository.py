"""Budget domain repository."""

from typing import Optional

from sqlalchemy import func
from sqlmodel import Session, col, select

from app.domain.budget.schema import BudgetCreate, BudgetResponse, BudgetUpdate, CategoryInfo
from app.domain.category.repository import CategoryRepository
from app.exceptions import BudgetNotFoundError, UnauthorizedError
from app.models.budget import Budget
from app.models.category import Category, CategoryType


class BudgetRepository:
    """Repository for budget-related database operations."""

    def __init__(self, session: Session, category_repository: CategoryRepository):
        self.__session = session
        self.__category_repository = category_repository

    def _to_response(self, budget: Budget, category: Category) -> BudgetResponse:
        """Map a Budget + Category pair to a BudgetResponse."""
        return BudgetResponse(
            id=budget.id,
            name=budget.name,
            date=budget.date,
            value=budget.value,
            category=CategoryInfo(id=category.id, name=category.name, type=category.type),
        )

    def create_budget(self, user_id: str, data: BudgetCreate) -> BudgetResponse:
        """
        Create a new budget entry. The category is looked up by (user_id, name, type)
        and created automatically if it does not yet exist.

        Args:
            user_id: The authenticated user's ID
            data: Budget creation payload

        Returns:
            BudgetResponse: The created budget
        """
        category = self.__category_repository.get_or_create(
            user_id, data.category_name, data.category_type
        )
        budget = Budget(
            user_id=user_id,
            name=data.name,
            date=data.date,
            value=data.value,
            category_id=category.id,
        )
        self.__session.add(budget)
        self.__session.commit()
        self.__session.refresh(budget)
        self.__session.refresh(category)
        return self._to_response(budget, category)

    def get_budgets(
        self,
        user_id: str,
        year: int,
        month: int,
        category_type: Optional[CategoryType] = None,
    ) -> list[BudgetResponse]:
        """
        Return all budgets for the user in the given year/month, optionally
        filtered by category type.

        Args:
            user_id: The authenticated user's ID
            year: Year to filter by
            month: Month to filter by (1-12)
            category_type: Optional category type filter

        Returns:
            list[BudgetResponse]: Matching budget entries
        """
        statement = (
            select(Budget, Category)
            .join(Category, col(Budget.category_id) == col(Category.id))
            .where(
                Budget.user_id == user_id,
                func.extract("year", col(Budget.date)) == year,
                func.extract("month", col(Budget.date)) == month,
            )
        )
        if category_type is not None:
            statement = statement.where(Category.type == category_type)

        results = self.__session.exec(statement).all()
        return [self._to_response(budget, category) for budget, category in results]

    def update_budget(self, budget_id: int, user_id: str, data: BudgetUpdate) -> BudgetResponse:
        """
        Update an existing budget entry. Only fields present in the payload are modified.
        If either category_name or category_type is supplied, the other defaults to
        the existing category's value before the look-up/create step.

        Args:
            budget_id: ID of the budget to update
            user_id: The authenticated user's ID (ownership check)
            data: Fields to update

        Returns:
            BudgetResponse: The updated budget

        Raises:
            BudgetNotFoundError: If no budget with the given ID exists
            UnauthorizedError: If the budget belongs to a different user
        """
        budget = self.__session.get(Budget, budget_id)
        if not budget:
            raise BudgetNotFoundError(f"Budget with id {budget_id} not found")
        if budget.user_id != user_id:
            raise UnauthorizedError("You don't have permission to update this budget")

        if data.name is not None:
            budget.name = data.name
        if data.date is not None:
            budget.date = data.date
        if data.value is not None:
            budget.value = data.value

        if data.category_name is not None or data.category_type is not None:
            current_category = self.__session.get(Category, budget.category_id)
            if current_category is None:
                raise BudgetNotFoundError(f"Category for budget {budget_id} not found")
            new_name = data.category_name if data.category_name is not None else current_category.name
            new_type = data.category_type if data.category_type is not None else current_category.type
            category = self.__category_repository.get_or_create(user_id, new_name, new_type)
            budget.category_id = category.id
        else:
            fetched_category = self.__session.get(Category, budget.category_id)
            if fetched_category is None:
                raise BudgetNotFoundError(f"Category for budget {budget_id} not found")
            category = fetched_category

        self.__session.add(budget)
        self.__session.commit()
        self.__session.refresh(budget)
        return self._to_response(budget, category)

    def delete_budget(self, budget_id: int, user_id: str) -> None:
        """
        Delete a budget entry.

        Args:
            budget_id: ID of the budget to delete
            user_id: The authenticated user's ID (ownership check)

        Raises:
            BudgetNotFoundError: If no budget with the given ID exists
            UnauthorizedError: If the budget belongs to a different user
        """
        budget = self.__session.get(Budget, budget_id)
        if not budget:
            raise BudgetNotFoundError(f"Budget with id {budget_id} not found")
        if budget.user_id != user_id:
            raise UnauthorizedError("You don't have permission to delete this budget")

        self.__session.delete(budget)
        self.__session.commit()

