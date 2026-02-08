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
- Python 3.14+ and uv (for backend)
- Docker (for SQL Server)

### Setup and Run

**Backend:**
```bash
cd backend
docker compose up -d              # Start database
uv sync --group dev               # Install dependencies
cp .env.template .env             # Configure (add Google OAuth credentials)
uv run init-db                    # Initialize database
uv run alembic upgrade head       # Run migrations
uv run server                     # Start server → http://localhost:8000
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

## API Documentation

Once the backend is running:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **Health Check:** http://localhost:8000/health

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
