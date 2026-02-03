from logging import Logger
from fastapi import APIRouter


class AuthRouter:
    def __init__(self, path: str, logger: Logger):
        self.__path: str = path
        self.__logger: Logger = logger
        
    def create_router(self) -> APIRouter:
        self.__logger.info("Creating Auth Router")
        self.__logger.info(f"Auth Router Path: {self.__path}")
        
        router = APIRouter(prefix=self.__path, tags=["auth"])
        
        @router.post("/login")
        async def login():
            return {"message": "Login endpoint"}
        
        return router

    