"""Health check router."""

from fastapi import APIRouter, status

from app.domain.health.repository import HealthRepository
from app.domain.health.schema import HealthResponse


class HealthRouter:
    """Router for health check endpoints"""
    
    def __init__(self, path: str = "/health"):
        self.__path: str = path
        self.__repository = HealthRepository()
    
    def create_router(self) -> APIRouter:
        """Create and configure the health check router"""
        router = APIRouter(prefix=self.__path, tags=["health"])
        
        @router.get("", response_model=HealthResponse, status_code=status.HTTP_200_OK)
        async def health_check():
            """
            Health check endpoint that verifies database connectivity.
            
            Returns:
                HealthResponse: Status of the service and database connection
            """
            db_healthy, db_message = self.__repository.check_database_connection()
            
            if db_healthy:
                return HealthResponse(
                    status="healthy",
                    database="connected",
                    message=db_message
                )
            else:
                return HealthResponse(
                    status="unhealthy",
                    database="disconnected",
                    message=db_message
                )
        
        return router
