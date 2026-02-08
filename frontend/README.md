# budgetMe Frontend

React frontend for the budgetMe application with TypeScript and Vite.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- ESLint

## Prerequisites

- Node.js 18+
- npm or yarn

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

The app will be available at http://localhost:5173

## Available Scripts

### Development

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run preview      # Preview production build locally
```

### Code Quality

```bash
npm run lint         # Run ESLint to check code quality
```

## Project Structure

```
frontend/
├── src/
│   ├── assets/          # Static assets (images, fonts, etc.)
│   ├── App.tsx          # Main application component
│   ├── App.css          # Application styles
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global styles (Tailwind imports)
├── public/              # Public static files
├── index.html           # HTML entry point
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── package.json         # Project dependencies and scripts
```

## Development Guidelines

### TypeScript

This project uses TypeScript for type safety. Make sure to:
- Define proper types for components and functions
- Avoid using `any` type when possible
- Use interfaces for component props

### Styling

The project uses Tailwind CSS for styling:
- Use Tailwind utility classes for styling
- Custom styles can be added in component CSS files
- Global styles are in `index.css`

### Code Quality

Before committing:
1. Run `npm run lint` to check for linting errors
2. Ensure the build succeeds with `npm run build`
3. Test your changes in the browser

## Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist/` directory and can be deployed to any static hosting service.

To preview the production build locally:

```bash
npm run preview
```

## Environment Variables

Create a `.env` file in the frontend directory for environment-specific configuration:

```env
VITE_API_URL=http://localhost:8000
```

Access in code using `import.meta.env.VITE_API_URL`

## Connecting to Backend

The frontend connects to the backend API at http://localhost:8000 by default. Make sure the backend server is running before starting the frontend development server.

See [../backend/README.md](../backend/README.md) for backend setup instructions.
