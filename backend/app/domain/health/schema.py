"""Health check schemas."""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Response model for health check"""
    status: str
    database: str
    message: str | None = None
