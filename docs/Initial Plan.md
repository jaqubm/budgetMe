# budgetMe — Application Plan

## Overview

**budgetMe** is a personal budgeting web application built with Next.js and hosted on Azure. It has no database of its own — all user data is stored directly on the user's Google Drive as CSV files. Authentication is handled via Google OAuth2 using NextAuth.js, which simultaneously grants access to the Google Drive API.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Authentication | NextAuth.js + Google OAuth2 |
| Data storage | Google Drive API (CSV files) |
| Hosting | Azure App Service |
| Styling | Tailwind CSS |
| Language | TypeScript |

---

## Authentication

### NextAuth.js with Google Provider

- Provider: `GoogleProvider` from NextAuth.js
- Required OAuth2 scopes:
  - `openid`
  - `email`
  - `profile`
  - `https://www.googleapis.com/auth/drive.file` — access only to files created by the app
- `access_token` for Google Drive API stored in the NextAuth session (JWT session)
- After sign-in, the user is redirected to the current month's dashboard

### Configuration (`/app/api/auth/[...nextauth]/route.ts`)

```ts
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  authorization: {
    params: {
      scope: 'openid email profile https://www.googleapis.com/auth/drive.file',
      access_type: 'offline',
      prompt: 'consent',
    },
  },
})
```

The `jwt` callback is extended to persist `access_token` and `refresh_token` so the token can be refreshed without requiring the user to sign in again.

---

## Data Structure on Google Drive

```
Google Drive (user's)
└── budgetMe/
    └── {year}/               e.g. 2026/
        └── {month}/          e.g. 04/
            ├── income.csv
            ├── expenses.csv
            └── savings.csv
```

### CSV File Format

Every CSV file shares the same structure:

```csv
date,amount,description,constant
2026-04-01,5000.00,Salary,true
2026-04-15,1200.00,Bonus,false
```

| Column | Type | Description |
|---|---|---|
| `date` | `YYYY-MM-DD` | Transaction date |
| `amount` | `decimal` | Amount (always positive) |
| `description` | `string` | Transaction description |
| `constant` | `boolean` | If `true`, the entry is automatically copied to the next month |

### Constant Entries — Copy Logic

When a month is opened for the first time (i.e. its CSV files do not yet exist), the application checks the previous month's files and copies every row where `constant` is `true`. The copied rows preserve all field values, including `constant: true`, so they propagate forward indefinitely. The user can toggle the `constant` flag off for any entry in the current month, which prevents it from being carried over to the following month.

### Categories

| Key | Label | File |
|---|---|---|
| `income` | Income | `income.csv` |
| `expenses` | Expenses | `expenses.csv` |
| `savings` | Savings | `savings.csv` |

---

## Google Drive API — Operations

All data operations go through the Google Drive API using the user's token from the session.

### Folder Structure Initialization

On the first visit to a given month the application:
1. Checks whether the `budgetMe` folder exists in Drive root → creates it if not
2. Checks whether the `{year}` folder exists inside `budgetMe` → creates it if not
3. Checks whether the `{month}` folder exists → creates it if not
4. Checks whether `income.csv`, `expenses.csv`, `savings.csv` exist → if not:
   a. Reads the corresponding file from the **previous month** (handles year boundary, e.g. Dec → Jan)
   b. Filters rows where `constant` is `true`
   c. Creates the new file pre-populated with those rows (date adjusted to the 1st of the new month)
   d. If no previous month file exists, creates an empty file with the header row only

### CRUD Operations

| Operation | Description |
|---|---|
| **Read** | Fetch CSV file via `drive.files.get` with `alt=media`, parse into an array of records |
| **Add entry** | Fetch file, append row (with `constant` flag), update via `drive.files.update` |
| **Delete entry** | Fetch file, remove row by index, update |
| **Edit entry** | Fetch file, replace row by index (including toggling `constant`), update |
| **Toggle constant** | Shorthand edit — flip the `constant` field for a single row by index, update |

---

## Application Architecture (Next.js App Router)

```
/app
├── layout.tsx                  # Root layout, SessionProvider
├── page.tsx                    # Home page / redirect to /dashboard
├── api/
│   ├── auth/
│   │   └── [...nextauth]/
│   │       └── route.ts        # NextAuth handler
│   └── drive/
│       ├── entries/
│       │   └── route.ts        # GET /api/drive/entries?year=&month=&category=
│       └── entry/
│           └── route.ts        # POST, PUT, DELETE /api/drive/entry
├── dashboard/
│   └── [year]/
│       └── [month]/
│           └── page.tsx        # Month view with three categories
├── components/
│   ├── CategoryTable.tsx       # Table of entries for a category
│   ├── EntryRow.tsx            # Single entry row with constant toggle, edit, delete
│   ├── AddEntryForm.tsx        # Form for adding a new entry (includes constant checkbox)
│   ├── MonthlySummary.tsx      # Monthly summary (total per category + balance)
│   ├── MonthPicker.tsx         # Month navigation (arrows + swipe on mobile)
│   ├── ConstantBanner.tsx      # Dismissible banner shown when month was pre-populated
│   └── Header.tsx              # Header with user info and sign-out
└── lib/
    ├── google-drive.ts         # Google Drive API wrapper (CRUD on CSV files)
    ├── csv.ts                  # CSV parser and serializer
    └── auth.ts                 # Helper for retrieving session / token
```

### API Routes

#### `GET /api/drive/entries`

Query params: `year`, `month`, `category`

Returns an array of entries from the corresponding CSV file.

#### `POST /api/drive/entry`

Body: `{ year, month, category, date, amount, description, constant }`

Appends a new row to the CSV file.

#### `PUT /api/drive/entry`

Body: `{ year, month, category, index, date, amount, description, constant }`

Updates a row in the CSV file by index.

#### `PATCH /api/drive/entry`

Body: `{ year, month, category, index, constant }`

Toggles only the `constant` flag for a row by index.

#### `DELETE /api/drive/entry`

Body: `{ year, month, category, index }`

Removes a row from the CSV file by index.

---

## UI / UX & Responsive Design

- **Mobile-first** layout using Tailwind CSS responsive prefixes (`sm:`, `md:`, `lg:`)
- Clean, minimal interface with clear typographic hierarchy
- Color coding per category: Income → green, Expenses → red, Savings → blue
- Entries marked as `constant` are visually distinguished (e.g. pin icon, subtle highlight)
- Touch-friendly tap targets (min 44 × 44 px) for mobile users
- The constant toggle is a single-tap checkbox/switch — no extra confirmation required
- Forms use bottom sheets on mobile, modals on desktop
- Month navigation is a swipeable carousel on mobile

---

## Dashboard View (`/dashboard/{year}/{month}`)

- Defaults to the current year and month
- Three sections (or tabs): **Income**, **Expenses**, **Savings**
- Each section contains:
  - A table of entries (date, amount, description, constant flag) with edit and delete buttons
  - A **constant toggle** (checkbox / switch) per row — toggling it off prevents the entry from being copied next month
  - An "Add entry" button opening a bottom sheet (mobile) or modal (desktop)
  - A subtotal: sum of amounts in the category
- At the top of the page: monthly summary — balance (income − expenses − savings)
- Navigation between months (previous/next arrows); swipe gesture on mobile
- If the current month was pre-populated from the previous month's constant entries, a dismissible info banner is shown

---

## Hosting on Azure

### Azure App Service

- Plan: **B1** (Basic) or **P0v3** (Premium v3) — sufficient for Next.js SSR
- Runtime: **Node.js 20 LTS**
- Deployment: GitHub Actions → Azure App Service (continuous deployment)

### Environment Variables (App Service → Configuration)

```
NEXTAUTH_URL=https://<app-name>.azurewebsites.net
NEXTAUTH_SECRET=<random-secret>
GOOGLE_CLIENT_ID=<from-Google-Cloud-Console>
GOOGLE_CLIENT_SECRET=<from-Google-Cloud-Console>
```

### GitHub Actions Workflow (`.github/workflows/azure.yml`)

1. `npm ci`
2. `npm run build`
3. Deploy to Azure App Service via the `azure/webapps-deploy` action

### Google Cloud Console Setup

- Create a project
- Enable **Google Drive API** and **Google People API**
- Create OAuth2 credentials (Web application type)
- Add authorized redirect URI: `https://<app-name>.azurewebsites.net/api/auth/callback/google`

---

## Security

- `drive.file` scope — the app can only see **files it created itself**, not the user's entire Drive
- Tokens refreshed automatically by NextAuth (refresh token rotation)
- All API routes validate the session (`getServerSession`) — missing session returns 401
- `NEXTAUTH_SECRET` stored as an encrypted secret in Azure App Service configuration
- All communication over HTTPS only (Azure provides the SSL certificate)

---

## Data Flow Diagram

```
User
    │
    ▼
[Next.js — App Router]
    │  JWT session
    ▼
[API Routes /api/drive/*]
    │  access_token from session
    ▼
[Google Drive API]
    │
    ▼
[CSV file on user's Google Drive]
budgetMe/{year}/{month}/{category}.csv
```

---

## Implementation Order

1. [ ] Initialize Next.js project with TypeScript and Tailwind CSS
2. [ ] Configure NextAuth.js with Google Provider (scope `drive.file`)
3. [ ] Build `lib/google-drive.ts` wrapper — folder and CSV file creation
4. [ ] Implement CSV parser/serializer with `constant` column support (`lib/csv.ts`)
5. [ ] Implement constant-entry copy logic in folder initialization
6. [ ] Implement API routes (`/api/drive/entries`, `/api/drive/entry` — GET, POST, PUT, PATCH, DELETE)
7. [ ] Build mobile-first dashboard layout with Tailwind CSS
8. [ ] Build `CategoryTable` + `EntryRow` with constant toggle
9. [ ] Build `AddEntryForm` (bottom sheet / modal) with constant checkbox
10. [ ] Implement month navigation with swipe gesture support
11. [ ] Add monthly summary, balance, and `ConstantBanner`
12. [ ] Configure Azure App Service + GitHub Actions
13. [ ] Test manually end-to-end (desktop + mobile)
