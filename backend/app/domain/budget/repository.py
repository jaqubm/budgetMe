"""Budget domain repository."""

from typing import Optional

from sqlmodel import Session, col, select

from app.domain.budget.schema import BudgetCloneRequest, BudgetCreate, BudgetResponse, BudgetUpdate, CategoryInfo
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
            year=budget.year,
            month=budget.month,
            value=budget.value,
            reoccur=budget.reoccur,
            cloned_from_id=budget.cloned_from_id,
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
            year=data.year,
            month=data.month,
            value=data.value,
            reoccur=data.reoccur,
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
                Budget.year == year,
                Budget.month == month,
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
        if data.year is not None:
            budget.year = data.year
        if data.month is not None:
            budget.month = data.month
        if data.value is not None:
            budget.value = data.value
        if data.reoccur is not None:
            budget.reoccur = data.reoccur

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

    def clone_reoccurring_budgets(self, user_id: str, data: BudgetCloneRequest) -> list[BudgetResponse]:
        """
        Clone all reoccurring budgets from the previous month into the target year/month.

        The previous month is calculated automatically (e.g. target 2026/3 → source 2026/2;
        target 2026/1 → source 2025/12). Budgets in the target month that already have a
        cloned_from_id pointing to a source budget are skipped to prevent duplicate cloning.

        Args:
            user_id: The authenticated user's ID
            data: Target year and month to clone into

        Returns:
            list[BudgetResponse]: Newly created cloned budget entries (empty if all were
            already cloned or no reoccurring source budgets exist)
        """
        prev_year, prev_month = (data.year - 1, 12) if data.month == 1 else (data.year, data.month - 1)

        # Fetch all reoccurring budgets from the previous month
        source_statement = (
            select(Budget, Category)
            .join(Category, col(Budget.category_id) == col(Category.id))
            .where(
                Budget.user_id == user_id,
                Budget.year == prev_year,
                Budget.month == prev_month,
                Budget.reoccur == True,  # noqa: E712
            )
        )
        sources = self.__session.exec(source_statement).all()

        if not sources:
            return []

        # Determine which source IDs are already cloned into the target month
        source_ids = [b.id for b, _ in sources]
        existing_statement = select(Budget.cloned_from_id).where(
            Budget.user_id == user_id,
            Budget.year == data.year,
            Budget.month == data.month,
            col(Budget.cloned_from_id).in_(source_ids),
        )
        already_cloned_ids: set[int] = {
            cid for cid in self.__session.exec(existing_statement).all() if cid is not None
        }

        # Clone each source that has not yet been cloned into the target month
        cloned: list[BudgetResponse] = []
        for source_budget, category in sources:
            if source_budget.id in already_cloned_ids:
                continue
            new_budget = Budget(
                user_id=user_id,
                name=source_budget.name,
                year=data.year,
                month=data.month,
                value=source_budget.value,
                reoccur=source_budget.reoccur,
                cloned_from_id=source_budget.id,
                category_id=source_budget.category_id,
            )
            self.__session.add(new_budget)
            self.__session.flush()
            self.__session.refresh(new_budget)
            self.__session.refresh(category)
            cloned.append(self._to_response(new_budget, category))

        self.__session.commit()
        return cloned

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

