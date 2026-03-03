"""Category domain repository."""

from typing import Optional

from sqlmodel import Session, select

from app.domain.category.schema import BudgetDateResponse, CategoryResponse, CategoryUpdate
from app.exceptions import CategoryNotFoundError, UnauthorizedError
from app.models.budget import Budget
from app.models.category import Category, CategoryType


class CategoryRepository:
    """Repository for category-related database operations."""

    def __init__(self, session: Session):
        self.__session = session

    def get_or_create(self, user_id: str, name: str, cat_type: CategoryType) -> Category:
        """
        Retrieve an existing category for the user or create a new one.

        Args:
            user_id: The authenticated user's ID
            name: Category name
            cat_type: Category type

        Returns:
            Category: Existing or newly created category
        """
        statement = select(Category).where(
            Category.user_id == user_id,
            Category.name == name,
            Category.type == cat_type,
        )
        category = self.__session.exec(statement).first()
        if not category:
            category = Category(user_id=user_id, name=name, type=cat_type)
            self.__session.add(category)
            self.__session.flush()
        return category

    def get_categories(
        self, user_id: str, category_type: Optional[CategoryType] = None
    ) -> list[CategoryResponse]:
        """
        Return all categories belonging to the user, optionally filtered by type.

        Args:
            user_id: The authenticated user's ID
            category_type: Optional type filter

        Returns:
            list[CategoryResponse]: Matching categories
        """
        statement = select(Category).where(Category.user_id == user_id)
        if category_type is not None:
            statement = statement.where(Category.type == category_type)
        categories = self.__session.exec(statement).all()
        return [CategoryResponse(id=c.id, name=c.name, type=c.type) for c in categories]

    def get_budget_dates(self, user_id: str, category_id: int) -> list[BudgetDateResponse]:
        """
        Return distinct year/month pairs in which the given category has budget entries.

        Args:
            user_id: The authenticated user's ID (ownership check)
            category_id: Category ID to query

        Returns:
            list[BudgetDateResponse]: Sorted distinct year/month pairs

        Raises:
            CategoryNotFoundError: If the category does not exist
            UnauthorizedError: If the category belongs to a different user
        """
        category = self.__session.get(Category, category_id)
        if not category:
            raise CategoryNotFoundError(f"Category with id {category_id} not found")
        if category.user_id != user_id:
            raise UnauthorizedError("You don't have permission to access this category")

        statement = select(Budget.date).where(
            Budget.category_id == category_id,
            Budget.user_id == user_id,
        )
        dates = self.__session.exec(statement).all()

        seen: set[tuple[int, int]] = set()
        result: list[BudgetDateResponse] = []
        for d in dates:
            key = (d.year, d.month)
            if key not in seen:
                seen.add(key)
                result.append(BudgetDateResponse(year=d.year, month=d.month))
        return sorted(result, key=lambda x: (x.year, x.month))

    def update_category(
        self, category_id: int, user_id: str, data: CategoryUpdate
    ) -> CategoryResponse:
        """
        Update the name of an existing category.

        Args:
            category_id: ID of the category to update
            user_id: The authenticated user's ID (ownership check)
            data: Update payload containing the new name

        Returns:
            CategoryResponse: The updated category

        Raises:
            CategoryNotFoundError: If the category does not exist
            UnauthorizedError: If the category belongs to a different user
        """
        category = self.__session.get(Category, category_id)
        if not category:
            raise CategoryNotFoundError(f"Category with id {category_id} not found")
        if category.user_id != user_id:
            raise UnauthorizedError("You don't have permission to update this category")

        category.name = data.name
        self.__session.add(category)
        self.__session.commit()
        self.__session.refresh(category)
        return CategoryResponse(id=category.id, name=category.name, type=category.type)

    def delete_category(self, category_id: int, user_id: str) -> None:
        """
        Delete a category. All budget entries linked to this category are removed
        automatically via the database-level CASCADE on the foreign key.

        Args:
            category_id: ID of the category to delete
            user_id: The authenticated user's ID (ownership check)

        Raises:
            CategoryNotFoundError: If the category does not exist
            UnauthorizedError: If the category belongs to a different user
        """
        category = self.__session.get(Category, category_id)
        if not category:
            raise CategoryNotFoundError(f"Category with id {category_id} not found")
        if category.user_id != user_id:
            raise UnauthorizedError("You don't have permission to delete this category")

        self.__session.delete(category)
        self.__session.commit()
