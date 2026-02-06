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
