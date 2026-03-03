# budgetMe

A modern budget management application with a React frontend and FastAPI backend.

## Project Structure

```
budgetMe/
├── frontend/          # React + TypeScript frontend → See frontend/README.md
│   ├── src/
│   ├── public/
│   └── package.json
└── backend/           # FastAPI backend → See backend/README.md
    ├── app/
    ├── alembic/
    └── pyproject.toml
```

## Tech Stack

### Frontend
- React 19, TypeScript, Vite, Tailwind CSS

### Backend
- Python 3.14, FastAPI, SQLModel, Azure SQL Edge, Google OAuth2

## Quick Start

### Prerequisites
- Node.js 18+ (for frontend)
- Python 3.14+ and Poetry (for backend)
- Docker (for SQL Server)

### Setup and Run

**Backend:**
```bash
cd backend
docker compose up -d              # Start database
poetry install                    # Install dependencies
cp .env.template .env             # Configure (add Google OAuth credentials)
poetry run init-db                # Initialize database
poetry run alembic upgrade head   # Run migrations
poetry run server                 # Start server → http://localhost:8000
```

📖 **Detailed backend documentation:** [backend/README.md](backend/README.md)

**Frontend:**
```bash
cd frontend
npm install                       # Install dependencies
npm run dev                       # Start dev server → http://localhost:5173
```

📖 **Detailed frontend documentation:** [frontend/README.md](frontend/README.md)

### Root Commands

From the project root:
```bash
npm run backend:dev               # Start backend
npm run frontend:dev              # Start frontend
```

## Key Features

- 🔐 **Authentication:** Google OAuth2 integration
- 💾 **Database:** SQL Server with automatic migrations (Alembic)
- 🏥 **Health Check:** `/health` endpoint for service monitoring
- 📚 **API Documentation:** Interactive Swagger UI at `/docs`
- ⚡ **Hot Reload:** Both frontend and backend support hot module replacement

## API Endpoints

Base URL: `http://localhost:8000`

All endpoints except `/health` require a Google OAuth2 Bearer token (`Authorization: Bearer <token>`).

> `category_type` values: `income` | `expense` | `saving`

### Health
| Method | Path | Response |
|---|---|---|
| `GET` | `/health` | `200 { status, database, message }` |

### Auth
| Method | Path | Response |
|---|---|---|
| `POST` | `/auth/verify` | `200 { valid, user? }` |
| `GET` | `/auth/me` | `200 { email, name, picture? }` |

### Budget
| Method | Path | Description |
|---|---|---|
| `POST` | `/budget` | Create budget entry |
| `GET` | `/budget?year&month[&category_type]` | List budgets for a given month |
| `PATCH` | `/budget/{id}` | Partial update |
| `DELETE` | `/budget/{id}` | Delete budget entry |

### Category
| Method | Path | Description |
|---|---|---|
| `GET` | `/category[?category_type]` | List user categories |
| `GET` | `/category/{id}/budget-dates` | Months where category is used |
| `PATCH` | `/category/{id}` | Rename category |
| `DELETE` | `/category/{id}` | Delete category + all its budgets |

📖 Full request/response details: [backend/README.md](backend/README.md#api-reference)

## Development Workflow

1. Start the backend (database + API server)
2. Start the frontend dev server
3. Make your changes
4. Run linters and tests before committing

For detailed commands and workflows, see:
- [backend/README.md](backend/README.md) - Backend development guide
- [frontend/README.md](frontend/README.md) - Frontend development guide

## Contributing

1. Create a feature branch
2. Follow the development guidelines in respective READMEs
3. Run code quality checks
4. Submit a pull request

## License

See [LICENSE](LICENSE) file for details.
