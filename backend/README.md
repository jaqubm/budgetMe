# budgetMe — Backend

FastAPI backend for the budgetMe personal finance application. Handles Google OAuth2 authentication, budget management, and category organisation. Built on **Python 3.14**, **SQLModel**, and **Azure SQL Edge** (SQL Server via ODBC).

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Configuration](#configuration)
- [Getting Started](#getting-started)
- [Database](#database)
- [Authentication](#authentication)
- [API Reference](#api-reference)
- [Exception Hierarchy](#exception-hierarchy)
- [Development Tools](#development-tools)

---

## Tech Stack

| Layer | Library / Tool |
|---|---|
| Web framework | [FastAPI](https://fastapi.tiangolo.com/) ≥ 0.129 |
| ORM / schema | [SQLModel](https://sqlmodel.tiangolo.com/) ≥ 0.0.33 + SQLAlchemy |
| Validation | [Pydantic v2](https://docs.pydantic.dev/) ≥ 2.12 |
| Settings | [pydantic-settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/) ≥ 2.12 |
| ASGI server | [Uvicorn](https://www.uvicorn.org/) ≥ 0.40 |
| Database driver | pyodbc ≥ 5.3 (ODBC Driver 18 for SQL Server) |
| Database | Azure SQL Edge (Docker) |
| Migrations | [Alembic](https://alembic.sqlalchemy.org/) ≥ 1.18 |
| Auth | Google OAuth2 via httpx + Google userinfo endpoint |
| HTTP client | [httpx](https://www.python-httpx.org/) ≥ 0.28 |
| Package manager | [Poetry](https://python-poetry.org/) |
| Type checking | [mypy](https://mypy-lang.org/) ≥ 1.19 |
| Linter | [Ruff](https://docs.astral.sh/ruff/) ≥ 0.15 |
| Testing | pytest ≥ 9.0 + pytest-asyncio |

---

## Project Structure

```
backend/
├── pyproject.toml              # Poetry dependencies, scripts, mypy/alembic config
├── docker-compose.yml          # Azure SQL Edge container definition
├── init_db.py                  # One-shot script: creates the SQL database if absent
├── alembic/
│   ├── env.py                  # Alembic runtime — reads DatabaseConfig, imports all models
│   ├── script.py.mako          # Migration file template
│   └── versions/               # Auto-generated migration files (chronological)
│       ├── initial_setup_…py
│       ├── add_category_table_…py
│       ├── add_user_id_to_category_…py
│       ├── add_cascade_delete_…py
│       └── replace_date_with_year_and_month_…py
└── app/
    ├── main.py                 # Entry point: loads .env, creates app, defines main()
    ├── server.py               # Server class: FastAPI factory, middleware, router wiring
    ├── constants.py            # Env / CORS string constants
    ├── exceptions.py           # Application exception hierarchy
    ├── dependencies.py         # FastAPI Depends functions (session, repos, user auth)
    ├── database.py             # Engine factory (cached), get_session generator
    ├── config/
    │   ├── app.py              # AppConfig: aggregates all sub-configs (lru_cache singleton)
    │   ├── server.py           # ServerConfig: host, port, env, CORS, log level
    │   ├── auth.py             # AuthConfig: Google client ID/secret, session key
    │   └── database.py         # DatabaseConfig: server, credentials, ODBC URL builder
    ├── models/
    │   ├── base.py             # BaseSQLModel(SQLModel) — shared base for all tables
    │   ├── category.py         # Category table + CategoryType enum
    │   └── budget.py           # Budget table with CASCADE FK → category
    └── domain/
        ├── health/
        │   ├── router.py       # GET /health
        │   ├── repository.py   # DB ping via SELECT 1
        │   └── schema.py       # HealthResponse
        ├── auth/
        │   ├── router.py       # POST /auth/verify, GET /auth/me
        │   ├── repository.py   # Google userinfo token verification
        │   └── schema.py       # UserInfo, VerifyTokenResponse
        ├── budget/
        │   ├── router.py       # POST/GET /budget, PATCH/DELETE /budget/{id}
        │   ├── repository.py   # BudgetRepository (depends on CategoryRepository)
        │   └── schema.py       # BudgetCreate, BudgetUpdate, BudgetResponse, CategoryInfo
        └── category/
            ├── router.py       # GET /category, GET /category/{id}/budget-dates,
            │                   # PATCH/DELETE /category/{id}
            ├── repository.py   # CategoryRepository
            └── schema.py       # CategoryResponse, CategoryUpdate, BudgetDateResponse
```

---

## Architecture Overview

The backend follows a **layered, domain-driven** layout:

```
HTTP Request
    │
    ▼
Router  (app/domain/*/router.py)
    │  validates input via Pydantic schemas
    │  resolves FastAPI Depends
    ▼
Repository  (app/domain/*/repository.py)
    │  business logic + DB queries via SQLModel/SQLAlchemy
    ▼
SQLModel Session  (app/database.py)
    │
    ▼
Azure SQL Edge
```

### Key patterns

**Class-based routers** — each domain exposes a `XRouter` class with a `create_router() -> APIRouter` method. The `Server` class in `server.py` instantiates all four routers and includes them into the main FastAPI app. This keeps router configuration isolated and testable.

**Dependency injection** — all repositories and the current user ID are resolved via `fastapi.Depends`. `get_budget_repository` itself depends on `get_category_repository`, reflecting that `BudgetRepository` receives a `CategoryRepository` in its constructor. FastAPI builds the full dependency graph automatically.

```python
# dependencies.py
def get_budget_repository(
    session: Session = Depends(get_session),
    category_repository: CategoryRepository = Depends(get_category_repository),
) -> BudgetRepository:
    return BudgetRepository(session, category_repository)
```

**Circular import prevention** — `app/dependencies.py` uses `from __future__ import annotations` and `TYPE_CHECKING` for return-type hints only. All concrete repository imports are deferred to the function body (lazy import pattern). This avoids the circular chain: `dependencies → domain.health → domain.health.router → dependencies`.

**Category auto-creation** — when a budget is created or updated, `CategoryRepository.get_or_create` is called with `(user_id, name, type)`. If no matching row exists it is inserted via `session.flush()` so the new `category.id` is available before the budget row is written, all within the same transaction.

**Ownership enforcement** — every repository method that modifies or reads user-scoped data checks `row.user_id == user_id`. Mismatches raise `UnauthorizedError` which the router converts to `HTTP 403`.

**CASCADE delete** — the `budget.category_id` FK is defined with `ondelete="CASCADE"` at the SQLAlchemy/ODBC level. Deleting a category automatically removes all its budget entries at the database level with no extra application code required.

---

## Configuration

All settings are read from environment variables (or a `.env` file in the `backend/` directory) via **pydantic-settings**. Each config class uses a distinct env prefix.

### Environment variables

#### Server (`SERVER_*`)

| Variable | Default | Description |
|---|---|---|
| `SERVER_ENV` | `DEV` | `DEV` or `PROD` — controls CORS origins |
| `SERVER_HOST` | `0.0.0.0` | Uvicorn bind address |
| `SERVER_PORT` | `8000` | Uvicorn bind port |
| `SERVER_ROOT_PATH` | `/api` | OpenAPI root path prefix |
| `SERVER_LOG_LEVEL` | `info` | Uvicorn log level |
| `SERVER_DEBUG_MODE` | `true` | Enables Uvicorn `--reload` |
| `SERVER_CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Allowed CORS origins (DEV only) |

#### Auth (no prefix — direct env names)

| Variable | Default | Description |
|---|---|---|
| `GOOGLE_CLIENT_ID` | `""` | Google OAuth2 client ID |
| `GOOGLE_CLIENT_SECRET` | `""` | Google OAuth2 client secret |
| `SESSION_SECRET_KEY` | `your-session-secret-key-change-in-production` | Starlette session HMAC key |

#### Database (`DATABASE_*`)

| Variable | Default | Description |
|---|---|---|
| `DATABASE_SERVER` | `localhost` | SQL Server hostname |
| `DATABASE_PORT` | `1433` | SQL Server port |
| `DATABASE_DATABASE` | `budgetme` | Target database name |
| `DATABASE_USERNAME` | `sa` | SQL Server user |
| `DATABASE_PASSWORD` | `YourStrong@Passw0rd` | SQL Server password |
| `DATABASE_DRIVER` | `ODBC Driver 18 for SQL Server` | ODBC driver name |
| `DATABASE_ENCRYPT` | `true` | Encrypt the connection |
| `DATABASE_TRUST_SERVER_CERTIFICATE` | `true` | Trust self-signed cert (for Docker) |
| `DATABASE_CONNECTION_TIMEOUT` | `30` | Timeout in seconds |

Create `backend/.env` to override any of these:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SESSION_SECRET_KEY=change-me-in-production
```

### CORS behaviour

- **DEV** (`SERVER_ENV=DEV`): allows `localhost:5173`, `localhost:3000`, `localhost:8000`.
- **PROD** (`SERVER_ENV=PROD`): allows only `https://budgetme.jaqubm.dev`.

---

## Getting Started

### Prerequisites

- Python 3.14+
- [Poetry](https://python-poetry.org/docs/#installation)
- Docker + Docker Compose
- [ODBC Driver 18 for SQL Server](https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server)

### 1 — Install dependencies

```bash
cd backend
poetry install
```

Dev dependencies (mypy, ruff, pytest) are included by default. To skip them:

```bash
poetry install --no-dev
```

### 2 — Configure environment variables

Create `backend/.env` and fill in at minimum:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SESSION_SECRET_KEY=change-me-minimum-32-chars
```

All other variables have sensible defaults for local development (see [Configuration](#configuration)).

### 3 — Start the database

```bash
docker compose up -d
```

Starts **Azure SQL Edge** on port `1433`. Data is persisted in the `sqlserver_data` Docker volume.

### 4 — Create the database schema

```bash
poetry run init-db
```

Connects to the SQL Server `master` database and creates the `budgetme` database if it does not exist. Retries up to **10 times** with a **3-second** delay to handle container startup latency.

### 5 — Run migrations

```bash
poetry run alembic upgrade head
```

### 6 — Start the server

```bash
poetry run server
```

The API is available at `http://localhost:8000`.

| URL | Description |
|---|---|
| `http://localhost:8000/docs` | Swagger UI (interactive API docs, OAuth2 flow built in) |
| `http://localhost:8000/redoc` | ReDoc |
| `http://localhost:8000/health` | Health check (no auth required) |

---

## Database

### Models

#### `Category`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `INTEGER` | PK, auto-increment | |
| `user_id` | `VARCHAR(255)` | NOT NULL, indexed | Google email of the owner |
| `name` | `VARCHAR(255)` | NOT NULL | Category display name |
| `type` | `VARCHAR` (enum) | NOT NULL, indexed | `income` \| `expense` \| `saving` |

#### `Budget`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `INTEGER` | PK, auto-increment | |
| `user_id` | `VARCHAR(255)` | NOT NULL, indexed | Google email of the owner |
| `name` | `VARCHAR(255)` | NOT NULL | Budget entry label |
| `year` | `INTEGER` | NOT NULL, indexed | `2000–2100` |
| `month` | `INTEGER` | NOT NULL, indexed | `1–12` |
| `value` | `FLOAT` | NOT NULL, default `0.0` | Non-negative monetary value |
| `category_id` | `INTEGER` | FK → `category.id` **ON DELETE CASCADE**, indexed | |

### Migrations

Managed by **Alembic** with autogenerate. File naming convention: `{slug}_{YYYY}_{MM}_{DD}-{rev}.py`.

| Migration | Description |
|---|---|
| `initial_setup_2026_02_08-…` | Creates `budget` table (`id`, `user_id`, `name`, `date`) |
| `add_category_table_2026_03_03-…` | Adds `category` table; adds `value` + `category_id` FK to `budget` |
| `add_user_id_to_category_table_2026_03_03-…` | Adds `user_id` column + index to `category` |
| `add_cascade_delete_budget_on_category_2026_03_03-…` | Recreates `category_id` FK with `ON DELETE CASCADE` |
| `replace_date_with_year_and_month_in_2026_03_03-…` | Drops `date` column; adds indexed `year` + `month` columns |

Common Alembic commands:

```bash
# Apply all pending migrations
poetry run alembic upgrade head

# Roll back the last migration
poetry run alembic downgrade -1

# Generate a new migration after changing a model
poetry run alembic revision --autogenerate -m "short description"

# Show current revision
poetry run alembic current

# Show migration history
poetry run alembic history
```

### Docker database management

```bash
# Start the container in the background
docker compose up -d

# Stop the container (data preserved)
docker compose down

# Stop and delete all data (volume removed)
docker compose down -v

# View SQL Server logs
docker logs budgetme-sqlserver
```

---

## Authentication

Authentication uses **Google OAuth2**. The frontend obtains a Google access token and sends it as a Bearer token on every protected request:

```
Authorization: Bearer <google_access_token>
```

The backend verifies the token by querying Google's userinfo endpoint:

```
GET https://www.googleapis.com/oauth2/v3/userinfo
Authorization: Bearer <token>
```

The `email` field from the response is used as the `user_id` throughout the application — all `Category` and `Budget` rows are scoped to the owner's email address.

The `get_current_user_id` FastAPI dependency (`app/dependencies.py`) handles this flow and is injected into every protected endpoint via `Depends(get_current_user_id)`. Invalid or expired tokens result in `HTTP 401 Unauthorized`.

---

## API Reference

All endpoints are accessible under the `/api` root path (configurable via `SERVER_ROOT_PATH`). Protected endpoints require a valid Google Bearer token.

### Health — `/health`

| Method | Path | Auth | Status | Description |
|---|---|---|---|---|
| GET | `/health` | — | 200 | Returns service + database status |

**Response `200`**

```json
{
  "status": "healthy",
  "database": "connected",
  "message": "Database connection successful"
}
```

| Field | Type | Values |
|---|---|---|
| `status` | string | `"healthy"` \| `"unhealthy"` |
| `database` | string | `"connected"` \| `"disconnected"` |
| `message` | string \| null | Diagnostic description |

---

### Auth — `/auth`

| Method | Path | Auth | Status | Description |
|---|---|---|---|---|
| POST | `/auth/verify` | Bearer token | 200 | Validate a Google access token |
| GET | `/auth/me` | Bearer token | 200 | Return the authenticated user's profile |

**Response `200` — `POST /auth/verify`**

```json
{
  "valid": true,
  "user": {
    "email": "user@example.com",
    "name": "Jane Doe",
    "picture": "https://lh3.googleusercontent.com/..."
  }
}
```

When the token is invalid, `valid` is `false` and `user` is `null`.

**Response `200` — `GET /auth/me`**

```json
{
  "email": "user@example.com",
  "name": "Jane Doe",
  "picture": "https://lh3.googleusercontent.com/..."
}
```

| Field | Type | Constraints |
|---|---|---|
| `email` | string | Valid email (EmailStr) |
| `name` | string | ≤ 255 chars |
| `picture` | string \| null | Valid HTTP/HTTPS URL |

---

### Budget — `/budget`

All endpoints require authentication. The `user_id` is derived from the Bearer token — clients never send it explicitly.

| Method | Path | Auth | Status | Description |
|---|---|---|---|---|
| POST | `/budget` | ✅ | 201 | Create a budget entry |
| GET | `/budget` | ✅ | 200 | List budgets for a given year/month |
| PATCH | `/budget/{budget_id}` | ✅ | 200 | Partially update a budget entry |
| DELETE | `/budget/{budget_id}` | ✅ | 204 | Delete a budget entry |

#### `POST /budget`

**Request body**

```json
{
  "name": "Rent",
  "year": 2026,
  "month": 3,
  "value": 1500.00,
  "category_name": "Housing",
  "category_type": "expense"
}
```

| Field | Type | Constraints | Required |
|---|---|---|---|
| `name` | string | 1–255 chars, whitespace stripped | ✅ |
| `year` | integer | 2000–2100 | ✅ |
| `month` | integer | 1–12 | ✅ |
| `value` | float | ≥ 0.0, default `0.0` | No |
| `category_name` | string | 1–255 chars, whitespace stripped | ✅ |
| `category_type` | string | `income` \| `expense` \| `saving` | ✅ |

If a category matching `(category_name, category_type)` does not yet exist for this user, it is created automatically in the same transaction.

**Response `201`**

```json
{
  "id": 1,
  "name": "Rent",
  "year": 2026,
  "month": 3,
  "value": 1500.00,
  "category": {
    "id": 1,
    "name": "Housing",
    "type": "expense"
  }
}
```

#### `GET /budget`

**Query parameters**

| Parameter | Type | Constraints | Required |
|---|---|---|---|
| `year` | integer | 2000–2100 | ✅ |
| `month` | integer | 1–12 | ✅ |
| `category_type` | string | `income` \| `expense` \| `saving` | No |

**Response `200`** — array of `BudgetResponse` objects (same shape as POST response above).

#### `PATCH /budget/{budget_id}`

All body fields are optional. Only supplied fields are updated.

**Request body**

```json
{
  "name": "Rent (updated)",
  "value": 1600.00,
  "category_name": "Housing",
  "category_type": "expense"
}
```

| Field | Type | Constraints |
|---|---|---|
| `name` | string \| null | 1–255 chars, whitespace stripped |
| `year` | integer \| null | 2000–2100 |
| `month` | integer \| null | 1–12 |
| `value` | float \| null | ≥ 0.0 |
| `category_name` | string \| null | 1–255 chars, whitespace stripped |
| `category_type` | string \| null | `income` \| `expense` \| `saving` |

If `category_name` or `category_type` is provided, the matching category is resolved (or created) before the update. If only one is provided, the other defaults to the existing category's current value.

**Response `200`** — updated `BudgetResponse`.

**Error responses**: `403 Forbidden` (not the owner), `404 Not Found`.

#### `DELETE /budget/{budget_id}`

**Response `204 No Content`**

**Error responses**: `403 Forbidden`, `404 Not Found`.

---

### Category — `/category`

All endpoints require authentication.

| Method | Path | Auth | Status | Description |
|---|---|---|---|---|
| GET | `/category` | ✅ | 200 | List all categories for the user |
| GET | `/category/{category_id}/budget-dates` | ✅ | 200 | List distinct year/month pairs with budgets |
| PATCH | `/category/{category_id}` | ✅ | 200 | Rename a category |
| DELETE | `/category/{category_id}` | ✅ | 204 | Delete category (cascades to all linked budgets) |

#### `GET /category`

**Query parameters**

| Parameter | Type | Constraints | Required |
|---|---|---|---|
| `category_type` | string | `income` \| `expense` \| `saving` | No |

**Response `200`**

```json
[
  { "id": 1, "name": "Housing",  "type": "expense" },
  { "id": 2, "name": "Salary",   "type": "income"  },
  { "id": 3, "name": "Vacation", "type": "saving"  }
]
```

#### `GET /category/{category_id}/budget-dates`

Returns every distinct `(year, month)` pair in which the given category has at least one budget entry, sorted ascending. Useful for building date navigation in the frontend.

**Response `200`**

```json
[
  { "year": 2026, "month": 1 },
  { "year": 2026, "month": 2 },
  { "year": 2026, "month": 3 }
]
```

**Error responses**: `403 Forbidden`, `404 Not Found`.

#### `PATCH /category/{category_id}`

**Request body**

```json
{ "name": "Utilities" }
```

| Field | Type | Constraints |
|---|---|---|
| `name` | string | 1–255 chars, whitespace stripped |

**Response `200`** — updated `CategoryResponse`.

**Error responses**: `403 Forbidden`, `404 Not Found`.

#### `DELETE /category/{category_id}`

Deleting a category automatically removes **all budget entries** that reference it (database-level `ON DELETE CASCADE`).

**Response `204 No Content`**

**Error responses**: `403 Forbidden`, `404 Not Found`.

---

## Exception Hierarchy

All custom exceptions are defined in `app/exceptions.py` and converted to HTTP status codes in the router layer.

```
BudgetMeException
├── AuthenticationError
├── TokenVerificationError
│   ├── InvalidTokenError       → HTTP 401
│   └── ExpiredTokenError       → HTTP 401
├── OAuthError
├── ConfigurationError
├── BudgetNotFoundError         → HTTP 404
├── CategoryNotFoundError       → HTTP 404
└── UnauthorizedError           → HTTP 403
```

---

## Development Tools

### Type checking

```bash
poetry run mypy app
```

Configured in `pyproject.toml` with `python_version = "3.14"`, `warn_return_any = true`, `warn_unused_configs = true`. The codebase passes with **no issues** across all source files.

### Linting and formatting

```bash
poetry run ruff check app    # lint
poetry run ruff format app   # format
```

### Testing

```bash
poetry run pytest
```

Uses pytest ≥ 9.0 and pytest-asyncio for testing async endpoints.
