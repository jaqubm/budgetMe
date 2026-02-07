"""Application constants."""


class Env:
    """Environment types."""
    DEV = "DEV"
    PROD = "PROD"


class Cors:
    """CORS origins."""
    ORIGIN_PROD = "https://budgetme.jaqubm.dev"
    ORIGINS_DEV = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8000"
    ]
