# budgetMe Backend

Backend server for the budgetMe application, handling authentication and API endpoints.

## Tech Stack

- **Python 3.14** — runtime
- **FastAPI** — web framework
- **SQLModel / SQLAlchemy** — ORM
- **Pydantic + pydantic-settings** — data validation & configuration
- **Alembic** — database migrations
- **Azure SQL Edge** — database (runs in Docker)
- **Google OAuth2** — authentication

## Prerequisites

Before you start, make sure the following are installed:

- [Python 3.14+](https://www.python.org/downloads/)
- [Poetry](https://python-poetry.org/docs/#installation) — `pip install poetry`
- [Docker](https://www.docker.com/) — for the database container
- [ODBC Driver 18 for SQL Server](https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server) — required by `pyodbc`

## Setup

### 1. Install dependencies

```bash
cd backend
poetry install
```

To also install dev dependencies (linter, type checker, tests):

```bash
poetry install --with dev
```

### 2. Configure environment variables

```bash
cp .env.template .env
```

Open `.env` and fill in the required values:

| Variable | Description |
|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth2 client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth2 client secret |
| `SESSION_SECRET_KEY` | Random secret ≥ 32 characters |
| `DATABASE_PASSWORD` | SA password (must match `docker-compose.yml`) |

All other values can be left at their defaults for local development.

### 3. Start the database

```bash
docker compose up -d
```

This starts an **Azure SQL Edge** container on port `1433`. Data is persisted in a named Docker volume.

### 4. Create the database

```bash
poetry run init-db
```

### 5. Run database migrations

```bash
poetry run alembic upgrade head
```

## Running the Server

```bash
poetry run server
```

The API is available at <http://localhost:8000>.

| URL | Description |
|---|---|
| <http://localhost:8000/docs> | Swagger UI (interactive API docs) |
| <http://localhost:8000/redoc> | ReDoc |
| <http://localhost:8000/health> | Health check |

## Database Migrations

**Create a new migration** (after changing a model):

```bash
poetry run alembic revision --autogenerate -m "short description"
```

**Apply all pending migrations:**

```bash
poetry run alembic upgrade head
```

**Roll back the last migration:**

```bash
poetry run alembic downgrade -1
```

## Development

**Run the linter:**

```bash
poetry run ruff check
```

**Run the type checker:**

```bash
poetry run mypy app
```

**Run tests:**

```bash
poetry run pytest
```

## Docker

**Stop the database container:**

```bash
docker compose down
```

**Stop and remove all data:**

```bash
docker compose down -v
```

**View database logs:**

```bash
docker logs budgetme-sqlserver
```
