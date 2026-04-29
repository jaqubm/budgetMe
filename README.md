# budgetMe

A personal budgeting web app with no database. All data is stored as CSV files on your Google Drive.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Auth | NextAuth.js v5 + Google OAuth2 |
| Data | Google Drive API — CSV files |
| Styling | Tailwind CSS v4 (mobile-first) |
| Hosting | Azure Static Web Apps |

## How It Works

After signing in with Google, the app requests `drive.file` scope alongside standard auth scopes. This lets it create and manage CSV files exclusively within the `budgetMe/` folder on your Drive — it cannot read or modify any other files you own.

Data is organised as:

```
budgetMe/
└── {year}/
    └── {month}/
        ├── income.csv
        ├── expenses.csv
        └── savings.csv
```

Each CSV row: `date,amount,description,constant,planned,plannedAmount`

Entries marked `constant: true` are automatically copied into new months when you open them for the first time, with their date updated to the 1st of the new month.

## Running Locally

### Prerequisites

- Node.js 20+
- Yarn (`npm install -g yarn`)
- A Google Cloud project with the **Google Drive API** enabled and an OAuth 2.0 client configured

### 1. Clone and install

```bash
git clone https://github.com/your-username/budgetMe.git
cd budgetMe
yarn
```

### 2. Create a Google OAuth client

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Add to **Authorized redirect URIs**:
   ```
   http://localhost:5137/api/auth/callback/google
   ```
4. Note your **Client ID** and **Client Secret**

### 3. Configure environment variables

Create `.env.local` in the project root:

```env
NEXTAUTH_URL=http://localhost:5137
NEXTAUTH_SECRET=<random string, e.g. output of: openssl rand -base64 32>
GOOGLE_CLIENT_ID=<your client ID>
GOOGLE_CLIENT_SECRET=<your client secret>
```

### 4. Start the dev server

```bash
yarn dev
```

Open [http://localhost:5137](http://localhost:5137) and sign in with Google.

## Available Scripts

```bash
yarn dev      # Development server on port 5137
yarn build    # Production build
yarn start    # Serve production build
yarn lint     # ESLint
yarn test     # Vitest unit tests
```

## Deployment

The app deploys automatically to Azure Static Web Apps on push to `main` via GitHub Actions (`.github/workflows/deployment.yml`). Set the same four environment variables in your Azure Static Web App's Configuration panel.
