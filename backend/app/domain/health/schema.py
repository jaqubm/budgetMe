"""Health check schemas."""

from typing import Literal

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Response model for health check"""

    status: Literal["healthy", "unhealthy"]
    database: Literal["connected", "disconnected"]
    message: str | None = None
