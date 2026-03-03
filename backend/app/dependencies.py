"""Application dependencies for FastAPI dependency injection."""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2AuthorizationCodeBearer
from sqlmodel import Session

from app.database import get_session
from app.domain.health.repository import HealthRepository
from app.domain.budget.repository import BudgetRepository
from app.domain.category.repository import CategoryRepository
from app.exceptions import InvalidTokenError, TokenVerificationError

oauth2_scheme = OAuth2AuthorizationCodeBearer(
    authorizationUrl="https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl="https://oauth2.googleapis.com/token",
    scopes={"openid": "OpenID", "email": "Email", "profile": "Profile"},
)


async def get_current_user_id(token: str = Depends(oauth2_scheme)) -> str:
    """
    Dependency function to get the current authenticated user's ID (email).

    Args:
        token: OAuth2 Bearer token from Authorization header

    Returns:
        str: The authenticated user's email address used as user_id

    Raises:
        HTTPException: 401 if the token is invalid or verification fails
    """
    from app.domain.auth.repository import AuthRepository

    try:
        auth_repo = AuthRepository()
        user_info = await auth_repo.verify_google_token(token)
        return user_info.email
    except (InvalidTokenError, TokenVerificationError) as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


def get_health_repository(session: Session = Depends(get_session)) -> HealthRepository:
    """
    Dependency function to get HealthRepository instance.
    
    Args:
        session: Database session from dependency injection
        
    Returns:
        HealthRepository: Repository instance
    """
    return HealthRepository(session)


def get_category_repository(session: Session = Depends(get_session)) -> CategoryRepository:
    """
    Dependency function to get CategoryRepository instance.

    Args:
        session: Database session from dependency injection

    Returns:
        CategoryRepository: Repository instance
    """
    return CategoryRepository(session)


def get_budget_repository(
    session: Session = Depends(get_session),
    category_repository: CategoryRepository = Depends(get_category_repository),
) -> BudgetRepository:
    """
    Dependency function to get BudgetRepository instance.

    Args:
        session: Database session from dependency injection
        category_repository: CategoryRepository injected via Depends

    Returns:
        BudgetRepository: Repository instance
    """
    return BudgetRepository(session, category_repository)
