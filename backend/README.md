# budgetMe Backend

Backend server for the budgetMe application, handling authentication and API endpoints.

## Tech Stack

- Python 3.14
- FastAPI
- SQLModel (SQLAlchemy)
- Pydantic
- Azure SQL Edge (Docker)
- Alembic (Database migrations)
- Google OAuth2

## Prerequisites

- Python 3.14+
- Docker (for SQL Server)
- uv (Python package manager)

## Setup

1. **Clone the repository and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   uv sync --group dev
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.template .env
   ```
   Edit `.env` file with your configuration (Google OAuth credentials, etc.)

4. **Start the database:**
   ```bash
   docker compose up -d
   ```

5. **Initialize the database:**
   ```bash
   uv run init-db
   ```

6. **Run database migrations:**
   ```bash
   uv run alembic upgrade head
   ```

## Running the Server

Start the development server:
```bash
uv run server
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Health Check

Check if the service and database are running:
```bash
curl http://localhost:8000/health
```

## Database Commands

**Create database:**
```bash
uv run init-db
```

**Create new migration:**
```bash
uv run alembic revision --autogenerate -m "description"
```

**Apply migrations:**
```bash
uv run alembic upgrade head
```

**Rollback migration:**
```bash
uv run alembic downgrade -1
```

## Development

**Run linter:**
```bash
uv run ruff check
```

**Run type checker:**
```bash
uv run mypy app
```

**Run tests:**
```bash
uv run pytest
```

## Docker Management

**Stop database:**
```bash
docker compose down
```

**Remove database and volumes:**
```bash
docker compose down -v
```

**View database logs:**
```bash
docker logs budgetme-sqlserver
```
