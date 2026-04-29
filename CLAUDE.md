# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**budgetMe** is a personal budgeting Next.js web app hosted on Vercel. It has no database — all user data is stored as CSV files on the user's Google Drive. Authentication is handled via NextAuth.js + Google OAuth2, which simultaneously grants `drive.file` scope for Google Drive access.

## Commands

The project uses **yarn** as the package manager.

```bash
yarn          # Install dependencies
yarn dev      # Start development server
yarn build    # Production build
yarn lint     # Run ESLint
```

## Architecture

### Stack
- **Framework**: Next.js App Router (TypeScript)
- **Auth**: NextAuth.js with Google Provider (`openid email profile drive.file` scopes)
- **Data**: Google Drive API — CSV files, no database
- **Styling**: Tailwind CSS (mobile-first)
- **Hosting**: Vercel (deploys automatically on push to main)

### App Router Structure

```
/app
├── layout.tsx                          # Root layout, SessionProvider
├── page.tsx                            # Redirects to /dashboard/[year]/[month]
├── api/
│   ├── auth/[...nextauth]/route.ts     # NextAuth handler
│   └── drive/
│       ├── entries/route.ts            # GET ?year=&month=&category=
│       └── entry/route.ts             # POST / PUT / PATCH / DELETE
├── dashboard/[year]/[month]/
│   ├── page.tsx                        # Main month view (Server Component)
│   ├── loading.tsx                     # Loading skeleton shown during navigation
│   └── DashboardClient.tsx            # Interactive dashboard (Client Component)
├── components/                         # UI components (see below)
└── lib/
    ├── google-drive.ts                 # Drive API wrapper (folder init, CSV CRUD)
    ├── csv.ts                          # CSV parser/serializer
    └── auth.ts                         # Session/token helpers
```

### Data Model

CSV files live at `budgetMe/{year}/{month}/{category}.csv` on the user's Drive. Three categories: `income`, `expenses`, `savings`.

```csv
date,amount,description,constant
2026-04-01,5000.00,Salary,true
```

`constant: true` entries are automatically copied (with date updated to the 1st of the new month) when a new month is opened for the first time. All API routes call `getServerSession` and return 401 if the session is missing.

### Navigation

Use **only** Next.js built-in routing — no external router library:
- `<Link>` from `next/link`
- `redirect()` from `next/navigation` (Server Components)
- `useRouter()` from `next/navigation` (Client Components)

### Key Design Decisions

- `access_token` and `refresh_token` are persisted in the NextAuth JWT so Drive API calls work server-side
- `drive.file` scope means the app can only access files it created — not the user's full Drive
- Forms use bottom sheets on mobile, modals on desktop
- Color coding: Income → green, Expenses → red, Savings → blue
- `constant` entries are visually distinguished (pin icon / subtle highlight)
- Google Drive folder IDs are cached in-memory (`folderCache` in `google-drive.ts`) to avoid redundant list calls across warm Vercel function instances

## Environment Variables

Required in `.env.local` (dev) and Vercel project settings (prod):

```
NEXTAUTH_URL=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```
