"""Custom exceptions for the budgetMe application."""


class BudgetMeException(Exception):
    """Base exception for all application-specific exceptions."""
    pass


class AuthenticationError(BudgetMeException):
    """Raised when authentication fails."""
    pass


class TokenVerificationError(BudgetMeException):
    """Raised when token verification fails."""
    pass


class InvalidTokenError(TokenVerificationError):
    """Raised when the provided token is invalid."""
    pass


class ExpiredTokenError(TokenVerificationError):
    """Raised when the provided token has expired."""
    pass


class OAuthError(BudgetMeException):
    """Raised when OAuth operations fail."""
    pass


class ConfigurationError(BudgetMeException):
    """Raised when there are configuration issues."""
    pass


class BudgetNotFoundError(BudgetMeException):
    """Raised when a budget entry is not found."""
    pass


class CategoryNotFoundError(BudgetMeException):
    """Raised when a category is not found."""
    pass


class UnauthorizedError(BudgetMeException):
    """Raised when a user is not authorized to perform an action."""
    pass
