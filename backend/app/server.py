from contextlib import asynccontextmanager
import importlib
from logging import Logger
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.config.app_config import AppConfig
from app.domain.auth import AuthRouter

'''
Main Server for the budgetMe backend server.
'''

class Server:
    def __init__(self, logger: Logger, app_config: AppConfig):
        self.__logger: Logger = logger
        self.__app_config: AppConfig = app_config
        
    def __lifespan(self):
        """Lifespan event handler for startup and shutdown events."""
        @asynccontextmanager
        async def lifespan(app: FastAPI):
            # Startup logic
            # self.__do_db_migrations()
            
            yield
            
            # Shutdown logic
        return lifespan
    
    def create_server(self) -> FastAPI:
        """Create and configure the FastAPI server instance."""
        self.__logger.info("Creating FastAPI server.")
        
        app = FastAPI(
            title="budgetMe API",
            description="Backend server for the budgetMe application, handling authentication and API endpoints.",
            version=importlib.metadata.version("budgetme-backend"),
            lifespan=self.__lifespan(),
            docs_url="/docs",
            redoc_url="/redoc"
        )
        
        # Add CORS middleware
        origins = self.__app_config.server_config.cors_origins.split(",")
        app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        # Add session middleware for OAuth flow
        app.add_middleware(
            SessionMiddleware,
            secret_key=self.__app_config.auth_config.session_secret_key
        )
        auth_router = AuthRouter(
            path="/auth", 
            logger=self.__logger, 
            auth_config=self.__app_config.auth_config
        ).create_router()
        
        app.include_router(auth_router)
        
        self.__logger.info("Server created successfully.")
        self.__logger.info(f"API Documentation available at: http://{self.__app_config.server_config.host}:{self.__app_config.server_config.port}/docs")
        self.__logger.info(f"Alternative docs (ReDoc) at: http://{self.__app_config.server_config.host}:{self.__app_config.server_config.port}/redoc")
        
        return app
  