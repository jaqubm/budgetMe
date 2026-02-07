from dotenv import load_dotenv
import uvicorn
from app.config.app_config import get_app_config
from app.server import Server

load_dotenv()

_app_config = get_app_config()
app = Server(app_config=_app_config).create_server()


def main():
    """Entry point for running the server via CLI."""
    uvicorn.run(
        "app.main:app",  # Import string for reload support
        host=_app_config.server_config.host,
        port=_app_config.server_config.port,
        log_level=_app_config.server_config.log_level,
        reload=_app_config.server_config.debug_mode
    )
    

if __name__ == "__main__":
    """uv run server"""
    main()
    