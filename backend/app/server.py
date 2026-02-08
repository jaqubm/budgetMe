from contextlib import asynccontextmanager
import importlib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.config.app import AppConfig
from app.constants import Env, Cors
from app.domain.auth import AuthRouter
from app.domain.health import HealthRouter

'''
Main Server for the budgetMe backend server.
'''

class Server:
    def __init__(self, app_config: AppConfig):
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
        app = FastAPI(
            title="budgetMe API",
            description="Backend server for the budgetMe application, handling authentication and API endpoints.",
            version=importlib.metadata.version("budgetme-backend"),
            lifespan=self.__lifespan(),
            docs_url="/docs",
            redoc_url="/redoc",
            swagger_ui_init_oauth={
                "clientId": self.__app_config.auth_config.google_client_id,
                "clientSecret": self.__app_config.auth_config.google_client_secret,
                "scopes": "openid email profile",
                "usePkceWithAuthorizationCodeGrant": True,
            },
            swagger_ui_parameters={
                "oauth2RedirectUrl": f"http://{self.__app_config.server_config.host}:{self.__app_config.server_config.port}/docs/oauth2-redirect"
            }
        )
        
        # CORS configuration
        origins = [Cors.ORIGIN_PROD] if self.__app_config.server_config.env.upper() == Env.PROD else Cors.ORIGINS_DEV
        
        # Middleware configuration
        app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        app.add_middleware(
            SessionMiddleware,
            secret_key=self.__app_config.auth_config.session_secret_key
        )
        
        # Routers configuration
        health_router = HealthRouter(path="/health").create_router()
        auth_router = AuthRouter(
            path="/auth", 
            auth_config=self.__app_config.auth_config
        ).create_router()
        
        app.include_router(health_router)
        app.include_router(auth_router)
        
        return app
  