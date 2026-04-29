# budgetMe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full Next.js App Router budgeting web app with Google OAuth + Drive storage, fully responsive UI (mobile bottom-sheets + swipe gestures; desktop 3-column layout + modals) matching both approved designs, and a planned-entries feature for forecasting future months.

**Architecture:** Next.js App Router with server-side API routes for all Google Drive I/O; client components for interactive UI; CSV files on the user's Google Drive as the only data store. The `planned` field on entries enables forecasting future months, and `plannedAmount` is stored after verification. Responsive breakpoint at `768px`: below that uses mobile tabs + bottom sheets; above that uses 3-column + centred modals.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v4, NextAuth.js v5 (beta), Google APIs Node.js client, Plus Jakarta Sans (Google Fonts)

---

## File Map

| Path | Responsibility |
|---|---|
| `package.json` | Dependencies and scripts |
| `next.config.ts` | Next.js config (static export for Azure SWA) |
| `tsconfig.json` | TypeScript config |
| `tailwind.config.ts` | Tailwind config with custom theme |
| `postcss.config.mjs` | PostCSS config |
| `app/globals.css` | CSS custom properties + base styles |
| `app/layout.tsx` | Root layout — font, SessionProvider |
| `app/page.tsx` | Redirect to `/dashboard/[year]/[month]` |
| `app/sign-in/page.tsx` | Sign-in screen |
| `app/dashboard/[year]/[month]/page.tsx` | Dashboard (Server Component — fetches entries, passes to client) |
| `app/dashboard/[year]/[month]/DashboardClient.tsx` | Full interactive dashboard (Client Component) |
| `app/api/auth/[...nextauth]/route.ts` | NextAuth handler |
| `app/api/drive/entries/route.ts` | GET `/api/drive/entries?year=&month=&category=` |
| `app/api/drive/entry/route.ts` | POST / PUT / PATCH / DELETE `/api/drive/entry` |
| `app/components/Header.tsx` | App header with sign-out |
| `app/components/MonthPicker.tsx` | Prev/next arrows + month label + "Today" chip |
| `app/components/SummaryCard.tsx` | Balance card with bar + forecast mode |
| `app/components/CategoryTabs.tsx` | Income / Expenses / Savings tabs |
| `app/components/EntryRow.tsx` | Row with swipe, pin toggle, verify button |
| `app/components/EntrySheet.tsx` | Add/Edit bottom sheet |
| `app/components/VerifySheet.tsx` | Verify planned entry bottom sheet |
| `app/components/ConstantBanner.tsx` | "Pre-populated from last month" dismissible banner |
| `app/components/PlannedBanner.tsx` | "Forecast mode" banner with planned/verified counts |
| `app/components/icons.tsx` | Shared SVG icons (Pin, Plus, Trash, Edit, Check, ChevronLeft, ChevronRight, Google, Eye, Clock) |
| `lib/types.ts` | Shared TypeScript types (`Entry`, `MonthData`, `Category`) |
| `lib/csv.ts` | CSV parser + serializer supporting all 6 columns |
| `lib/auth.ts` | `getRequiredSession()` helper |
| `lib/google-drive.ts` | Drive folder init, CSV CRUD wrapper |

---

## Task 1: Project bootstrap

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `.env.local.example`
- Create: `.gitignore`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "budget-me",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.3.1",
    "next-auth": "^5.0.0-beta.25",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "googleapis": "^144.0.0"
  },
  "devDependencies": {
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5",
    "@tailwindcss/postcss": "^4",
    "tailwindcss": "^4",
    "eslint": "^9",
    "eslint-config-next": "15.3.1"
  }
}
```

- [ ] **Step 2: Create `next.config.ts`**

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  distDir: 'build',
};

export default nextConfig;
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
} satisfies Config;
```

- [ ] **Step 5: Create `postcss.config.mjs`**

```js
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
export default config;
```

- [ ] **Step 6: Create `.env.local.example`**

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change-me
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

- [ ] **Step 7: Run `yarn install` and verify it succeeds**

```bash
yarn install
```

Expected: lock file created, `node_modules/` populated, no errors.

- [ ] **Step 8: Commit**

```bash
git add package.json next.config.ts tsconfig.json tailwind.config.ts postcss.config.mjs .env.local.example
git commit -m "chore: bootstrap Next.js 15 project"
```

---

## Task 2: Shared types

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: Create `lib/types.ts`**

```ts
export type Category = 'income' | 'expenses' | 'savings';

export interface Entry {
  date: string;         // YYYY-MM-DD
  amount: number;
  description: string;
  constant: boolean;
  planned: boolean;
  plannedAmount?: number; // set after verification
}

export interface MonthData {
  income: Entry[];
  expenses: Entry[];
  savings: Entry[];
}

export const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'income',   label: 'Income'   },
  { key: 'expenses', label: 'Expenses' },
  { key: 'savings',  label: 'Savings'  },
];
```

- [ ] **Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add shared Entry/MonthData types"
```

---

## Task 3: CSV parser/serializer

**Files:**
- Create: `lib/csv.ts`
- Create: `lib/csv.test.ts`

- [ ] **Step 1: Install Vitest (dev only) for unit tests**

```bash
yarn add -D vitest
```

Add to `package.json` scripts:
```json
"test": "vitest run"
```

- [ ] **Step 2: Write failing tests in `lib/csv.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { parseCSV, serializeCSV } from './csv';

describe('parseCSV', () => {
  it('parses header-only CSV to empty array', () => {
    const csv = 'date,amount,description,constant,planned,plannedAmount\n';
    expect(parseCSV(csv)).toEqual([]);
  });

  it('parses a basic entry', () => {
    const csv = [
      'date,amount,description,constant,planned,plannedAmount',
      '2026-04-01,5000.00,Salary,true,false,',
    ].join('\n');
    expect(parseCSV(csv)).toEqual([{
      date: '2026-04-01',
      amount: 5000,
      description: 'Salary',
      constant: true,
      planned: false,
      plannedAmount: undefined,
    }]);
  });

  it('parses a verified planned entry', () => {
    const csv = [
      'date,amount,description,constant,planned,plannedAmount',
      '2026-05-01,5100.00,Salary,true,false,5000.00',
    ].join('\n');
    expect(parseCSV(csv)).toEqual([{
      date: '2026-05-01',
      amount: 5100,
      description: 'Salary',
      constant: true,
      planned: false,
      plannedAmount: 5000,
    }]);
  });

  it('handles legacy CSV without planned columns', () => {
    const csv = [
      'date,amount,description,constant',
      '2026-04-01,100.00,Test,false',
    ].join('\n');
    expect(parseCSV(csv)).toEqual([{
      date: '2026-04-01',
      amount: 100,
      description: 'Test',
      constant: false,
      planned: false,
      plannedAmount: undefined,
    }]);
  });
});

describe('serializeCSV', () => {
  it('round-trips entries', () => {
    const entries = [{
      date: '2026-04-01',
      amount: 5000,
      description: 'Salary',
      constant: true,
      planned: false,
      plannedAmount: undefined,
    }];
    const csv = serializeCSV(entries);
    expect(parseCSV(csv)).toEqual(entries);
  });

  it('preserves plannedAmount', () => {
    const entries = [{
      date: '2026-05-01',
      amount: 5100,
      description: 'Salary',
      constant: true,
      planned: false,
      plannedAmount: 5000,
    }];
    expect(parseCSV(serializeCSV(entries))).toEqual(entries);
  });

  it('serializes empty array to header only', () => {
    const csv = serializeCSV([]);
    expect(csv).toBe('date,amount,description,constant,planned,plannedAmount\n');
  });
});
```

- [ ] **Step 3: Run tests — verify they fail**

```bash
yarn test lib/csv.test.ts
```

Expected: error — `lib/csv.ts` not found.

- [ ] **Step 4: Implement `lib/csv.ts`**

```ts
import type { Entry } from './types';

const HEADER = 'date,amount,description,constant,planned,plannedAmount';

export function parseCSV(text: string): Entry[] {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length <= 1) return [];
  const header = lines[0].split(',');
  const hasPlanned = header.includes('planned');

  return lines.slice(1).map((line) => {
    const cols = line.split(',');
    const get = (col: string, fallback = '') =>
      header.includes(col) ? (cols[header.indexOf(col)] ?? fallback) : fallback;

    const plannedAmountRaw = get('plannedAmount');
    return {
      date:          get('date'),
      amount:        parseFloat(get('amount', '0')),
      description:   get('description'),
      constant:      get('constant') === 'true',
      planned:       hasPlanned ? get('planned') === 'true' : false,
      plannedAmount: plannedAmountRaw ? parseFloat(plannedAmountRaw) : undefined,
    };
  });
}

export function serializeCSV(entries: Entry[]): string {
  const rows = entries.map((e) =>
    [
      e.date,
      e.amount.toFixed(2),
      e.description.replace(/,/g, ';'), // guard against commas in description
      e.constant,
      e.planned,
      e.plannedAmount != null ? e.plannedAmount.toFixed(2) : '',
    ].join(',')
  );
  return [HEADER, ...rows].join('\n') + '\n';
}
```

- [ ] **Step 5: Run tests — verify they pass**

```bash
yarn test lib/csv.test.ts
```

Expected: all 6 tests pass.

- [ ] **Step 6: Commit**

```bash
git add lib/csv.ts lib/csv.test.ts package.json
git commit -m "feat: add CSV parser/serializer with planned columns"
```

---

## Task 4: Auth helper

**Files:**
- Create: `lib/auth.ts`

- [ ] **Step 1: Create `lib/auth.ts`**

```ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';

export async function getRequiredSession() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return { session: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { session, error: null };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/auth.ts
git commit -m "feat: add getRequiredSession auth helper"
```

---

## Task 5: Google Drive wrapper

**Files:**
- Create: `lib/google-drive.ts`

- [ ] **Step 1: Create `lib/google-drive.ts`**

```ts
import { google } from 'googleapis';
import { parseCSV, serializeCSV } from './csv';
import type { Entry, Category } from './types';

function driveClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: 'v3', auth });
}

async function findOrCreateFolder(
  drive: ReturnType<typeof google.drive>,
  name: string,
  parentId?: string
): Promise<string> {
  const q = parentId
    ? `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
    : `name='${name}' and mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false`;

  const res = await drive.files.list({ q, fields: 'files(id)', spaces: 'drive' });
  if (res.data.files?.length) return res.data.files[0].id!;

  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined,
    },
    fields: 'id',
  });
  return created.data.id!;
}

async function ensureFolderPath(drive: ReturnType<typeof google.drive>, year: string, month: string) {
  const rootId = await findOrCreateFolder(drive, 'budgetMe');
  const yearId = await findOrCreateFolder(drive, year, rootId);
  const monthId = await findOrCreateFolder(drive, month, yearId);
  return monthId;
}

async function findFile(
  drive: ReturnType<typeof google.drive>,
  name: string,
  parentId: string
): Promise<string | null> {
  const res = await drive.files.list({
    q: `name='${name}' and '${parentId}' in parents and trashed=false`,
    fields: 'files(id)',
    spaces: 'drive',
  });
  return res.data.files?.[0]?.id ?? null;
}

async function readCSVFile(drive: ReturnType<typeof google.drive>, fileId: string): Promise<Entry[]> {
  const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'text' });
  return parseCSV(res.data as string);
}

async function writeCSVFile(
  drive: ReturnType<typeof google.drive>,
  fileId: string,
  entries: Entry[]
): Promise<void> {
  await drive.files.update({
    fileId,
    media: { mimeType: 'text/csv', body: serializeCSV(entries) },
  });
}

async function createCSVFile(
  drive: ReturnType<typeof google.drive>,
  name: string,
  parentId: string,
  entries: Entry[]
): Promise<string> {
  const res = await drive.files.create({
    requestBody: { name, parents: [parentId] },
    media: { mimeType: 'text/csv', body: serializeCSV(entries) },
    fields: 'id',
  });
  return res.data.id!;
}

function prevYearMonth(year: string, month: string): { year: string; month: string } {
  let y = parseInt(year);
  let m = parseInt(month);
  m--;
  if (m < 1) { m = 12; y--; }
  return { year: String(y), month: String(m).padStart(2, '0') };
}

function firstOfMonth(year: string, month: string): string {
  return `${year}-${month}-01`;
}

export async function initMonth(
  accessToken: string,
  year: string,
  month: string
): Promise<boolean> {
  const drive = driveClient(accessToken);
  const monthFolderId = await ensureFolderPath(drive, year, month);
  const categories: Category[] = ['income', 'expenses', 'savings'];

  const needsInit = await Promise.all(
    categories.map((cat) => findFile(drive, `${cat}.csv`, monthFolderId))
  );

  if (needsInit.every((id) => id !== null)) return false; // all files exist

  const { year: py, month: pm } = prevYearMonth(year, month);
  const isPlan = false; // server doesn't know if future; caller decides

  for (let i = 0; i < categories.length; i++) {
    if (needsInit[i] !== null) continue; // file already exists
    const cat = categories[i];

    const prevFolderId = await ensureFolderPath(drive, py, pm);
    const prevFileId = await findFile(drive, `${cat}.csv`, prevFolderId);
    let seedEntries: Entry[] = [];
    if (prevFileId) {
      const prevEntries = await readCSVFile(drive, prevFileId);
      const firstDate = firstOfMonth(year, month);
      seedEntries = prevEntries
        .filter((e) => e.constant)
        .map((e) => ({ ...e, date: firstDate, planned: isPlan }));
    }
    await createCSVFile(drive, `${cat}.csv`, monthFolderId, seedEntries);
  }

  return true; // newly initialized
}

export async function getEntries(
  accessToken: string,
  year: string,
  month: string,
  category: Category
): Promise<Entry[]> {
  const drive = driveClient(accessToken);
  const monthFolderId = await ensureFolderPath(drive, year, month);
  const fileId = await findFile(drive, `${category}.csv`, monthFolderId);
  if (!fileId) return [];
  return readCSVFile(drive, fileId);
}

export async function addEntry(
  accessToken: string,
  year: string,
  month: string,
  category: Category,
  entry: Entry
): Promise<void> {
  const drive = driveClient(accessToken);
  const monthFolderId = await ensureFolderPath(drive, year, month);
  let fileId = await findFile(drive, `${category}.csv`, monthFolderId);
  if (!fileId) {
    await createCSVFile(drive, `${category}.csv`, monthFolderId, [entry]);
    return;
  }
  const entries = await readCSVFile(drive, fileId);
  entries.push(entry);
  await writeCSVFile(drive, fileId, entries);
}

export async function updateEntry(
  accessToken: string,
  year: string,
  month: string,
  category: Category,
  index: number,
  entry: Entry
): Promise<void> {
  const drive = driveClient(accessToken);
  const monthFolderId = await ensureFolderPath(drive, year, month);
  const fileId = await findFile(drive, `${category}.csv`, monthFolderId);
  if (!fileId) throw new Error('File not found');
  const entries = await readCSVFile(drive, fileId);
  entries[index] = entry;
  await writeCSVFile(drive, fileId, entries);
}

export async function patchEntry(
  accessToken: string,
  year: string,
  month: string,
  category: Category,
  index: number,
  patch: Partial<Entry>
): Promise<void> {
  const drive = driveClient(accessToken);
  const monthFolderId = await ensureFolderPath(drive, year, month);
  const fileId = await findFile(drive, `${category}.csv`, monthFolderId);
  if (!fileId) throw new Error('File not found');
  const entries = await readCSVFile(drive, fileId);
  entries[index] = { ...entries[index], ...patch };
  await writeCSVFile(drive, fileId, entries);
}

export async function deleteEntry(
  accessToken: string,
  year: string,
  month: string,
  category: Category,
  index: number
): Promise<void> {
  const drive = driveClient(accessToken);
  const monthFolderId = await ensureFolderPath(drive, year, month);
  const fileId = await findFile(drive, `${category}.csv`, monthFolderId);
  if (!fileId) throw new Error('File not found');
  const entries = await readCSVFile(drive, fileId);
  entries.splice(index, 1);
  await writeCSVFile(drive, fileId, entries);
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/google-drive.ts
git commit -m "feat: add Google Drive wrapper with CRUD and month init"
```

---

## Task 6: NextAuth configuration

**Files:**
- Create: `app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Create directory and route**

```bash
mkdir -p app/api/auth/\[...nextauth\]
```

- [ ] **Step 2: Create `app/api/auth/[...nextauth]/route.ts`**

```ts
import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/drive.file',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
  pages: {
    signIn: '/sign-in',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

- [ ] **Step 3: Add session type augmentation — create `types/next-auth.d.ts`**

```ts
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/auth types/next-auth.d.ts
git commit -m "feat: configure NextAuth with Google OAuth and drive.file scope"
```

---

## Task 7: API routes — entries and entry

**Files:**
- Create: `app/api/drive/entries/route.ts`
- Create: `app/api/drive/entry/route.ts`

- [ ] **Step 1: Create `app/api/drive/entries/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getEntries, initMonth } from '@/lib/google-drive';
import type { Category } from '@/lib/types';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const year     = searchParams.get('year') ?? '';
  const month    = searchParams.get('month') ?? '';
  const category = searchParams.get('category') as Category;

  if (!year || !month || !category) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const wasNew = await initMonth(session.accessToken, year, month);
  const entries = await getEntries(session.accessToken, year, month, category);
  return NextResponse.json({ entries, wasNew });
}
```

- [ ] **Step 2: Create `app/api/drive/entry/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { addEntry, updateEntry, patchEntry, deleteEntry } from '@/lib/google-drive';
import type { Category, Entry } from '@/lib/types';

async function getSession() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) return null;
  return session;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { year, month, category, ...entry } = body as {
    year: string; month: string; category: Category;
  } & Entry;

  await addEntry(session.accessToken, year, month, category, entry);
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { year, month, category, index, ...entry } = body as {
    year: string; month: string; category: Category; index: number;
  } & Entry;

  await updateEntry(session.accessToken, year, month, category, index, entry);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    year: string; month: string; category: Category; index: number;
    constant?: boolean; planned?: boolean; plannedAmount?: number; amount?: number;
  };
  const { year, month, category, index, ...patch } = body;

  await patchEntry(session.accessToken, year, month, category, index, patch);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    year: string; month: string; category: Category; index: number;
  };
  await deleteEntry(session.accessToken, body.year, body.month, body.category, body.index);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/drive
git commit -m "feat: implement drive entries and entry API routes"
```

---

## Task 8: Global styles, layout, and root redirect

**Files:**
- Create: `app/globals.css`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`

- [ ] **Step 1: Create `app/globals.css`**

```css
@import "tailwindcss";

@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

:root {
  --income:          oklch(48% 0.16 145);
  --income-light:    oklch(95% 0.06 145);
  --income-mid:      oklch(78% 0.12 145);
  --expense:         oklch(50% 0.18 22);
  --expense-light:   oklch(95% 0.06 22);
  --expense-mid:     oklch(78% 0.14 22);
  --savings:         oklch(50% 0.14 240);
  --savings-light:   oklch(95% 0.05 240);
  --savings-mid:     oklch(78% 0.11 240);
  --planned:         oklch(62% 0.005 260);
  --planned-bg:      oklch(94% 0.003 260);
  --planned-border:  oklch(84% 0.006 260);
  --bg:              oklch(96.5% 0.008 60);
  --surface:         oklch(100% 0 0);
  --text:            oklch(16% 0.01 260);
  --text-2:          oklch(45% 0.01 260);
  --text-3:          oklch(68% 0.008 260);
  --border:          oklch(90% 0.005 60);
}

* { box-sizing: border-box; }

body {
  font-family: 'Plus Jakarta Sans', sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
```

- [ ] **Step 2: Create `app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import './globals.css';
import { SessionProvider } from 'next-auth/react';

export const metadata: Metadata = {
  title: 'budgetMe',
  description: 'Personal budgeting — data stored on your Google Drive',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Create `app/page.tsx`**

```tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/sign-in');

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  redirect(`/dashboard/${year}/${month}`);
}
```

- [ ] **Step 4: Commit**

```bash
git add app/globals.css app/layout.tsx app/page.tsx
git commit -m "feat: add root layout with global CSS vars and home redirect"
```

---

## Task 9: Sign-in page

**Files:**
- Create: `app/sign-in/page.tsx`

- [ ] **Step 1: Create `app/sign-in/page.tsx`**

```tsx
'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { GoogleIcon } from '@/app/components/icons';

export default function SignInPage() {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    await signIn('google', { callbackUrl: '/' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)',
      padding: '0 28px',
      maxWidth: 430,
      margin: '0 auto',
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M8 22 L16 10 L24 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="10" y1="18" x2="22" y2="18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>budgetMe</div>
        <div style={{ fontSize: 14, color: 'var(--text-2)', textAlign: 'center', lineHeight: 1.5 }}>
          Your finances, stored<br/>only on your Google Drive.
        </div>
      </div>

      <div style={{ paddingBottom: 48 }}>
        <button
          onClick={handleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px 20px',
            border: '1.5px solid var(--border)',
            borderRadius: 14,
            background: 'var(--surface)',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--text)',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            opacity: loading ? 0.7 : 1,
            boxShadow: '0 1px 6px oklch(0% 0 0 / 0.05)',
          }}
        >
          {loading ? (
            <div style={{ width: 20, height: 20, border: '2px solid var(--border)', borderTopColor: 'var(--text)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          ) : (
            <GoogleIcon />
          )}
          {loading ? 'Signing in…' : 'Continue with Google'}
        </button>
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-3)', marginTop: 16, lineHeight: 1.5 }}>
          budgetMe only accesses files it creates in<br/>your Google Drive. Nothing else.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/sign-in
git commit -m "feat: add sign-in page with Google OAuth button"
```

---

## Task 10: Shared icons component

**Files:**
- Create: `app/components/icons.tsx`

- [ ] **Step 1: Create `app/components/icons.tsx`**

```tsx
export const PinIcon = ({ active, color }: { active: boolean; color: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={active ? color : 'none'} stroke={active ? color : 'var(--text-3)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l3 7h5l-4 4 2 7-6-4-6 4 2-7-4-4h5z"/>
  </svg>
);

export const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

export const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3,6 5,6 21,6"/>
    <path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6"/>
    <path d="M10,11v6"/><path d="M14,11v6"/>
    <path d="M9,6V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1v2"/>
  </svg>
);

export const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

export const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20,6 9,17 4,12"/>
  </svg>
);

export const ChevronLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15,18 9,12 15,6"/>
  </svg>
);

export const ChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9,18 15,12 9,6"/>
  </svg>
);

export const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="oklch(48% 0.1 250)" strokeWidth="2" strokeLinecap="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

export const ClockIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="9"/>
    <line x1="12" y1="7" x2="12" y2="12"/>
    <line x1="12" y1="12" x2="16" y2="14"/>
  </svg>
);
```

- [ ] **Step 2: Commit**

```bash
git add app/components/icons.tsx
git commit -m "feat: add shared SVG icon components"
```

---

## Task 11: Header component

**Files:**
- Create: `app/components/Header.tsx`

- [ ] **Step 1: Create `app/components/Header.tsx`**

```tsx
'use client';
import { signOut } from 'next-auth/react';

export function Header() {
  return (
    <div style={{ padding: '10px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.4px' }}>budgetMe</div>
      <button
        onClick={() => signOut({ callbackUrl: '/sign-in' })}
        style={{
          background: 'none',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '5px 10px',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-2)',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        Sign out
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/Header.tsx
git commit -m "feat: add Header component with sign-out"
```

---

## Task 12: MonthPicker component

**Files:**
- Create: `app/components/MonthPicker.tsx`

- [ ] **Step 1: Create `app/components/MonthPicker.tsx`**

```tsx
'use client';
import { ChevronLeft, ChevronRight, ClockIcon } from './icons';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function parseYM(ym: string) {
  const [y, m] = ym.split('-');
  return { year: parseInt(y), month: parseInt(m) };
}

function prevYM(ym: string) {
  let { year, month } = parseYM(ym);
  month--;
  if (month < 1) { month = 12; year--; }
  return `${year}-${String(month).padStart(2, '0')}`;
}

function nextYM(ym: string) {
  let { year, month } = parseYM(ym);
  month++;
  if (month > 12) { month = 1; year++; }
  return `${year}-${String(month).padStart(2, '0')}`;
}

interface Props {
  ym: string;         // "YYYY-MM"
  todayYm: string;    // current real month
  onChange: (ym: string) => void;
}

export function MonthPicker({ ym, todayYm, onChange }: Props) {
  const { year, month } = parseYM(ym);
  const isFuture = ym > todayYm;
  const isToday  = ym === todayYm;

  return (
    <div style={{ padding: '10px 14px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => onChange(prevYM(ym))}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center' }}
        >
          <ChevronLeft />
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            {MONTHS[month - 1]}
          </div>
          <div style={{ fontSize: 12, color: isFuture ? 'oklch(58% 0.07 250)' : 'var(--text-3)', fontWeight: isFuture ? 600 : 500 }}>
            {isFuture ? `${year} · Forecast` : year}
          </div>
        </div>

        <button
          onClick={() => onChange(nextYM(ym))}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center' }}
        >
          <ChevronRight />
        </button>
      </div>

      {!isToday && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6 }}>
          <button
            onClick={() => onChange(todayYm)}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: '3px 12px',
              fontSize: 11.5,
              fontWeight: 600,
              color: 'var(--text-2)',
              cursor: 'pointer',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <ClockIcon /> Today
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/MonthPicker.tsx
git commit -m "feat: add MonthPicker with forecast label and Today button"
```

---

## Task 13: SummaryCard component

**Files:**
- Create: `app/components/SummaryCard.tsx`

- [ ] **Step 1: Create `app/components/SummaryCard.tsx`**

```tsx
'use client';
import type { Entry } from '@/lib/types';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
const fmtShort = (n: number) => n >= 1000 ? '$' + (n / 1000).toFixed(1) + 'k' : '$' + n.toFixed(0);

const sumActual  = (arr: Entry[]) => arr.filter(e => !e.planned).reduce((a, b) => a + b.amount, 0);
const sumPlanned = (arr: Entry[]) => arr.filter(e => e.planned).reduce((a, b) => a + b.amount, 0);

interface Props {
  income:   Entry[];
  expenses: Entry[];
  savings:  Entry[];
  isFuture: boolean;
}

export function SummaryCard({ income, expenses, savings, isFuture }: Props) {
  const aI = sumActual(income),  pI = sumPlanned(income);
  const aE = sumActual(expenses), pE = sumPlanned(expenses);
  const aS = sumActual(savings),  pS = sumPlanned(savings);

  const tI = aI + pI, tE = aE + pE, tS = aS + pS;
  const balance = tI - tE - tS;
  const total = tI || 1;

  const expPct = Math.min(100, (tE / total) * 100);
  const savPct = Math.min(100, (tS / total) * 100);
  const incPct = Math.max(0, 100 - expPct - savPct);

  const aExpPct = Math.min(100, (aE / total) * 100);
  const aSavPct = Math.min(100, (aS / total) * 100);
  const aIncPct = Math.max(0, 100 - aExpPct - aSavPct);

  return (
    <div style={{
      margin: '10px 14px',
      padding: '16px 18px',
      borderRadius: 16,
      background: isFuture
        ? 'linear-gradient(140deg, oklch(22% 0.04 250), oklch(17% 0.02 260))'
        : 'var(--text)',
      color: 'white',
      boxShadow: isFuture ? '0 4px 24px oklch(18% 0.08 250 / 0.4)' : '0 4px 20px oklch(0% 0 0 / 0.15)',
      outline: isFuture ? '1.5px dashed oklch(50% 0.12 250 / 0.35)' : 'none',
      outlineOffset: '-1px',
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.5, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
        {isFuture ? 'Projected balance' : 'Balance this month'}
        {isFuture && (
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', background: 'oklch(100% 0 0 / 0.1)', padding: '2px 6px', borderRadius: 4, opacity: 1 }}>FORECAST</span>
        )}
      </div>

      <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', marginBottom: 14 }}>
        {balance >= 0
          ? <span>{fmt(balance)}{isFuture && <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.5, marginLeft: 6 }}>projected</span>}</span>
          : <span style={{ color: 'oklch(70% 0.18 22)' }}>{fmt(balance)}</span>
        }
      </div>

      {/* Balance bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ height: 6, borderRadius: 3, background: 'oklch(100% 0 0 / 0.12)', overflow: 'hidden', display: 'flex', marginBottom: isFuture ? 4 : 0 }}>
          <div style={{ width: `${incPct}%`, background: 'var(--income-mid)', transition: 'width 0.5s' }} />
          <div style={{ width: `${expPct}%`, background: 'var(--expense-mid)', transition: 'width 0.5s' }} />
          <div style={{ width: `${savPct}%`, background: 'var(--savings-mid)', transition: 'width 0.5s' }} />
        </div>
        {isFuture && (
          <>
            <div style={{ height: 3, borderRadius: 2, background: 'oklch(100% 0 0 / 0.08)', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${aIncPct}%`, background: 'oklch(100% 0 0 / 0.4)', transition: 'width 0.5s' }} />
              <div style={{ width: `${aExpPct}%`, background: 'oklch(100% 0 0 / 0.3)', transition: 'width 0.5s' }} />
              <div style={{ width: `${aSavPct}%`, background: 'oklch(100% 0 0 / 0.35)', transition: 'width 0.5s' }} />
            </div>
            <div style={{ fontSize: 9.5, opacity: 0.35, marginTop: 2, fontWeight: 500 }}>Thin bar = verified so far</div>
          </>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {([
          { label: 'Income',   actual: aI, planned: pI, color: 'var(--income-mid)'  },
          { label: 'Expenses', actual: aE, planned: pE, color: 'var(--expense-mid)' },
          { label: 'Savings',  actual: aS, planned: pS, color: 'var(--savings-mid)' },
        ] as const).map(({ label, actual, planned, color }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: 10.5, opacity: 0.6, fontWeight: 500 }}>{label}</span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{fmtShort(actual + planned)}</span>
            {isFuture && planned > 0 && (
              <span style={{ fontSize: 10, opacity: 0.45, fontWeight: 500 }}>{fmtShort(actual)} actual</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/SummaryCard.tsx
git commit -m "feat: add SummaryCard with balance bar and forecast mode"
```

---

## Task 14: CategoryTabs component

**Files:**
- Create: `app/components/CategoryTabs.tsx`

- [ ] **Step 1: Create `app/components/CategoryTabs.tsx`**

```tsx
'use client';
import type { Category } from '@/lib/types';

const CATEGORIES: { key: Category; label: string; color: string }[] = [
  { key: 'income',   label: 'Income',   color: 'var(--income)'  },
  { key: 'expenses', label: 'Expenses', color: 'var(--expense)' },
  { key: 'savings',  label: 'Savings',  color: 'var(--savings)' },
];

interface Props {
  active: Category;
  onChange: (cat: Category) => void;
  hasPending: Record<Category, boolean>;
}

export function CategoryTabs({ active, onChange, hasPending }: Props) {
  return (
    <div style={{ display: 'flex', gap: 6, padding: '12px 14px 0' }}>
      {CATEGORIES.map((c) => (
        <button
          key={c.key}
          onClick={() => onChange(c.key)}
          style={{
            flex: 1,
            padding: '7px 4px',
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: 12.5,
            fontWeight: 600,
            background: active === c.key ? c.color : 'var(--surface)',
            color: active === c.key ? 'white' : 'var(--text-2)',
            boxShadow: active === c.key ? `0 2px 10px ${c.color}55` : 'none',
            transition: 'all 0.18s',
            position: 'relative',
          }}
        >
          {c.label}
          {hasPending[c.key] && active !== c.key && (
            <span style={{
              position: 'absolute',
              top: 5,
              right: 5,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--planned)',
            }} />
          )}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/CategoryTabs.tsx
git commit -m "feat: add CategoryTabs with planned-entry indicator dots"
```

---

## Task 15: EntryRow component

**Files:**
- Create: `app/components/EntryRow.tsx`

- [ ] **Step 1: Create `app/components/EntryRow.tsx`**

```tsx
'use client';
import { useRef, useState } from 'react';
import type { Entry } from '@/lib/types';
import { PinIcon, TrashIcon, EditIcon, CheckIcon } from './icons';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

interface Props {
  entry: Entry;
  index: number;
  color: string;
  onDelete: (i: number) => void;
  onToggleConstant: (i: number) => void;
  onEdit: (i: number) => void;
  onVerify: (i: number) => void;
}

export function EntryRow({ entry, index, color, onDelete, onToggleConstant, onEdit, onVerify }: Props) {
  const [swiped, setSwiped] = useState(false);
  const touchStart = useRef<number | null>(null);
  const isPlanned = entry.planned;
  const swipeWidth = isPlanned ? 76 : 112;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (dx < -40) setSwiped(true);
    else if (dx > 20) setSwiped(false);
    touchStart.current = null;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ position: 'relative', overflow: 'hidden', borderRadius: 10 }}
    >
      {/* Swipe actions */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0,
        width: swipeWidth + 8,
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        gap: 4, padding: '0 8px',
      }}>
        {!isPlanned && (
          <button
            onClick={() => onEdit(index)}
            style={{ width: 38, height: 38, borderRadius: 10, background: 'oklch(88% 0.06 240)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--savings)' }}
          >
            <EditIcon />
          </button>
        )}
        <button
          onClick={() => onDelete(index)}
          style={{ width: 38, height: 38, borderRadius: 10, background: 'oklch(88% 0.06 22)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--expense)' }}
        >
          <TrashIcon />
        </button>
      </div>

      {/* Row content */}
      <div style={{
        background: isPlanned ? 'var(--planned-bg)' : 'var(--surface)',
        padding: '11px 12px',
        display: 'flex', alignItems: 'center', gap: 10,
        borderLeft: isPlanned ? '3px dashed var(--planned-border)' : '3px solid transparent',
        transform: swiped ? `translateX(-${swipeWidth}px)` : 'translateX(0)',
        transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
        borderRadius: 10, position: 'relative', zIndex: 1,
      }}>
        {/* Pin */}
        <button
          onClick={() => onToggleConstant(index)}
          title={entry.constant ? 'Recurring' : 'One-time'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, flexShrink: 0, display: 'flex', opacity: isPlanned ? 0.5 : 1 }}
        >
          <PinIcon active={entry.constant} color={isPlanned ? 'var(--planned)' : color} />
        </button>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: isPlanned ? 'var(--planned)' : 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {entry.description}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span>{entry.date.slice(5).replace('-', '/')}</span>
            {entry.constant && (
              <span style={{ color: isPlanned ? 'var(--planned)' : color, fontWeight: 600, fontSize: 10 }}>recurring</span>
            )}
            {isPlanned && (
              <span style={{ color: 'var(--planned)', fontWeight: 600, fontSize: 10, background: 'oklch(88% 0.004 260)', padding: '1px 5px', borderRadius: 4 }}>planned</span>
            )}
          </div>
        </div>

        {/* Amount + verify */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {isPlanned && (
            <button
              onClick={() => onVerify(index)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '5px 9px', borderRadius: 7,
                background: 'oklch(90% 0.005 260)', border: 'none', cursor: 'pointer',
                fontSize: 11.5, fontWeight: 700, color: 'var(--text-2)',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              <CheckIcon /> Verify
            </button>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: isPlanned ? 'var(--planned)' : color }}>
              {fmt(entry.amount)}
            </div>
            {!isPlanned && entry.plannedAmount != null && entry.plannedAmount !== entry.amount && (
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 500, textDecoration: 'line-through', textDecorationColor: 'oklch(78% 0 0)' }}>
                {fmt(entry.plannedAmount)}
              </div>
            )}
            {!isPlanned && entry.plannedAmount != null && entry.plannedAmount === entry.amount && (
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 500 }}>as planned</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/EntryRow.tsx
git commit -m "feat: add EntryRow with swipe, pin, verify, and planned styling"
```

---

## Task 16: EntrySheet (Add/Edit bottom sheet)

**Files:**
- Create: `app/components/EntrySheet.tsx`

- [ ] **Step 1: Create `app/components/EntrySheet.tsx`**

```tsx
'use client';
import { useEffect, useState } from 'react';
import type { Category, Entry } from '@/lib/types';

const CATEGORIES: { key: Category; label: string; color: string }[] = [
  { key: 'income',   label: 'Income',   color: 'var(--income)'  },
  { key: 'expenses', label: 'Expenses', color: 'var(--expense)' },
  { key: 'savings',  label: 'Savings',  color: 'var(--savings)' },
];

interface FormState {
  date: string;
  amount: string;
  description: string;
  constant: boolean;
  planned: boolean;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (entry: Entry) => void;
  editEntry: Entry | null;
  category: Category;
  isFuture: boolean;
  currentYm: string; // "YYYY-MM" used for default date
}

function Toggle({ value, onChange, color, label, sub }: { value: boolean; onChange: () => void; color: string; label: string; sub: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg)', borderRadius: 10, cursor: 'pointer' }}>
      <div onClick={onChange} style={{ width: 44, height: 26, borderRadius: 13, background: value ? color : 'var(--border)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 3, left: value ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 4px oklch(0% 0 0 / 0.2)' }} />
      </div>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{label}</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{sub}</div>
      </div>
    </label>
  );
}

export function EntrySheet({ visible, onClose, onSave, editEntry, category, isFuture, currentYm }: Props) {
  const cat = CATEGORIES.find((c) => c.key === category)!;
  const defaultDate = `${currentYm}-01`;

  const [form, setForm] = useState<FormState>({ date: defaultDate, amount: '', description: '', constant: false, planned: false });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (visible) {
      if (editEntry) {
        setForm({ ...editEntry, amount: String(editEntry.amount) });
      } else {
        setForm({ date: defaultDate, amount: '', description: '', constant: false, planned: isFuture });
      }
      setErrors({});
    }
  }, [visible, editEntry, isFuture, defaultDate]);

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.description.trim()) e.description = 'Required';
    if (!form.amount || isNaN(+form.amount) || +form.amount <= 0) e.amount = 'Enter a valid amount';
    if (!form.date) e.date = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ ...form, amount: parseFloat(form.amount) });
    onClose();
  };

  const inp = (err?: string) => ({
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: `1.5px solid ${err ? 'var(--expense)' : 'var(--border)'}`,
    fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif',
    color: 'var(--text)', background: 'var(--bg)', outline: 'none',
  });

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'oklch(0% 0 0 / 0.35)', zIndex: 50, opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none', transition: 'opacity 0.25s' }}
      />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 51,
        background: 'var(--surface)', borderRadius: '20px 20px 0 0',
        padding: '20px 20px 40px',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: '0 -4px 32px oklch(0% 0 0 / 0.15)',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 16px' }} />
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 18 }}>
          {editEntry ? 'Edit entry' : `Add ${cat.label} entry`}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>Description</label>
            <input
              style={inp(errors.description)}
              placeholder="e.g. Monthly Salary"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            {errors.description && <div style={{ fontSize: 11, color: 'var(--expense)', marginTop: 3 }}>{errors.description}</div>}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>Amount ($)</label>
              <input
                type="number" min="0" step="0.01"
                style={inp(errors.amount)}
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
              {errors.amount && <div style={{ fontSize: 11, color: 'var(--expense)', marginTop: 3 }}>{errors.amount}</div>}
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>Date</label>
              <input
                type="date"
                style={inp(errors.date)}
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
          </div>

          <Toggle
            value={form.planned}
            onChange={() => setForm((f) => ({ ...f, planned: !f.planned }))}
            color="var(--planned)"
            label="Planned entry"
            sub="Expected amount — verify when it happens"
          />

          <Toggle
            value={form.constant}
            onChange={() => setForm((f) => ({ ...f, constant: !f.constant }))}
            color={cat.color}
            label="Recurring entry"
            sub="Automatically carry over to next month"
          />
        </div>

        <button
          onClick={handleSave}
          style={{
            width: '100%', marginTop: 20, padding: '14px', borderRadius: 12,
            background: form.planned ? 'var(--planned)' : cat.color,
            border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700,
            color: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}
        >
          {editEntry ? 'Save changes' : (form.planned ? 'Add as planned' : 'Add entry')}
        </button>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/EntrySheet.tsx
git commit -m "feat: add EntrySheet add/edit bottom sheet with planned toggle"
```

---

## Task 17: VerifySheet component

**Files:**
- Create: `app/components/VerifySheet.tsx`

- [ ] **Step 1: Create `app/components/VerifySheet.tsx`**

```tsx
'use client';
import { useEffect, useState } from 'react';
import type { Entry } from '@/lib/types';
import { CheckIcon } from './icons';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

interface Props {
  visible: boolean;
  onClose: () => void;
  entry: Entry | null;
  onVerify: (actualAmount: number) => void;
  color: string;
}

export function VerifySheet({ visible, onClose, entry, onVerify, color }: Props) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && entry) {
      setAmount(String(entry.amount));
      setError('');
    }
  }, [visible, entry]);

  const handle = () => {
    if (!amount || isNaN(+amount) || +amount <= 0) {
      setError('Enter a valid amount');
      return;
    }
    onVerify(parseFloat(amount));
    onClose();
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'oklch(0% 0 0 / 0.35)', zIndex: 50, opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none', transition: 'opacity 0.25s' }}
      />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 51,
        background: 'var(--surface)', borderRadius: '20px 20px 0 0',
        padding: '20px 20px 40px',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: '0 -4px 32px oklch(0% 0 0 / 0.15)',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 16px' }} />

        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Verify entry</div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>{entry?.description}</div>
        </div>

        <div style={{ margin: '16px 0 4px', padding: '10px 14px', borderRadius: 10, background: 'var(--planned-bg)', border: '1px dashed var(--planned-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--planned)', fontWeight: 500 }}>Planned amount</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--planned)' }}>{entry ? fmt(entry.amount) : ''}</span>
        </div>

        <div style={{ marginTop: 12, marginBottom: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, display: 'block' }}>Actual amount ($)</label>
          <input
            type="number" min="0" step="0.01"
            style={{
              width: '100%', padding: '13px 14px', borderRadius: 10,
              border: `1.5px solid ${error ? 'var(--expense)' : 'var(--border)'}`,
              fontSize: 20, fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif',
              color: 'var(--text)', background: 'var(--bg)', outline: 'none',
              textAlign: 'center', letterSpacing: '-0.5px',
            }}
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setError(''); }}
          />
          {error && <div style={{ fontSize: 11, color: 'var(--expense)', marginTop: 3 }}>{error}</div>}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '13px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--text-2)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            Keep planned
          </button>
          <button
            onClick={handle}
            style={{ flex: 2, padding: '13px', borderRadius: 12, border: 'none', background: color, cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
          >
            <CheckIcon /> Verify
          </button>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/VerifySheet.tsx
git commit -m "feat: add VerifySheet for confirming planned entry amounts"
```

---

## Task 18: Banner components

**Files:**
- Create: `app/components/ConstantBanner.tsx`
- Create: `app/components/PlannedBanner.tsx`

- [ ] **Step 1: Create `app/components/ConstantBanner.tsx`**

```tsx
'use client';

interface Props {
  onDismiss: () => void;
}

export function ConstantBanner({ onDismiss }: Props) {
  return (
    <div style={{
      margin: '10px 14px 0', padding: '10px 14px', borderRadius: 10,
      background: 'oklch(93% 0.04 250)', border: '1px solid oklch(85% 0.07 250)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8,
    }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 14 }}>📋</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--savings)', marginBottom: 1 }}>Pre-populated from last month</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.4 }}>Recurring entries were carried over. You can remove or toggle them off.</div>
        </div>
      </div>
      <button
        onClick={onDismiss}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 16, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}
      >
        ×
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create `app/components/PlannedBanner.tsx`**

```tsx
'use client';
import { EyeIcon } from './icons';

interface Props {
  plannedCount: number;
  verifiedCount: number;
}

export function PlannedBanner({ plannedCount, verifiedCount }: Props) {
  return (
    <div style={{
      margin: '10px 14px 0', padding: '8px 14px', borderRadius: 10,
      background: 'oklch(97% 0.008 250)', border: '1px solid oklch(88% 0.02 250)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <EyeIcon />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'oklch(38% 0.1 250)' }}>Forecast mode</span>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
        {verifiedCount > 0 && (
          <span><span style={{ color: 'oklch(42% 0.12 145)', fontWeight: 700 }}>{verifiedCount}</span> verified</span>
        )}
        {verifiedCount > 0 && plannedCount > 0 && <span style={{ opacity: 0.3 }}>·</span>}
        {plannedCount > 0 && (
          <span><span style={{ fontWeight: 600 }}>{plannedCount}</span> planned</span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/components/ConstantBanner.tsx app/components/PlannedBanner.tsx
git commit -m "feat: add ConstantBanner and PlannedBanner components"
```

---

## Task 19: Dashboard client component

**Files:**
- Create: `app/dashboard/[year]/[month]/DashboardClient.tsx`

- [ ] **Step 1: Create directory**

```bash
mkdir -p app/dashboard/\[year\]/\[month\]
```

- [ ] **Step 2: Create `app/dashboard/[year]/[month]/DashboardClient.tsx`**

```tsx
'use client';
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Category, Entry, MonthData } from '@/lib/types';
import { Header } from '@/app/components/Header';
import { MonthPicker } from '@/app/components/MonthPicker';
import { SummaryCard } from '@/app/components/SummaryCard';
import { CategoryTabs } from '@/app/components/CategoryTabs';
import { EntryRow } from '@/app/components/EntryRow';
import { EntrySheet } from '@/app/components/EntrySheet';
import { VerifySheet } from '@/app/components/VerifySheet';
import { ConstantBanner } from '@/app/components/ConstantBanner';
import { PlannedBanner } from '@/app/components/PlannedBanner';
import { PlusIcon } from '@/app/components/icons';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

const CAT_COLORS: Record<Category, string> = {
  income:   'var(--income)',
  expenses: 'var(--expense)',
  savings:  'var(--savings)',
};

const CAT_LABELS: Record<Category, string> = {
  income:   'Income',
  expenses: 'Expenses',
  savings:  'Savings',
};

interface Props {
  year: string;
  month: string;
  todayYm: string;
  initialData: MonthData;
  wasNew: boolean;
}

export function DashboardClient({ year, month, todayYm, initialData, wasNew }: Props) {
  const router = useRouter();
  const ym = `${year}-${month}`;
  const isFuture = ym > todayYm;

  const [data, setData] = useState<MonthData>(initialData);
  const [activeTab, setActiveTab] = useState<Category>('income');
  const [showBanner, setShowBanner] = useState(wasNew && !isFuture);
  const [sheet, setSheet] = useState<{ open: boolean; editIndex: number | null }>({ open: false, editIndex: null });
  const [verifySheet, setVerifySheet] = useState<{ open: boolean; index: number | null }>({ open: false, index: null });
  const [loading, setLoading] = useState(false);

  const entries = data[activeTab] ?? [];
  const catColor = CAT_COLORS[activeTab];
  const catLabel = CAT_LABELS[activeTab];

  const handleChangeMonth = (newYm: string) => {
    const [y, m] = newYm.split('-');
    router.push(`/dashboard/${y}/${m}`);
  };

  const catActual  = entries.filter(e => !e.planned).reduce((a, b) => a + b.amount, 0);
  const catPlanned = entries.filter(e => e.planned).reduce((a, b) => a + b.amount, 0);

  const plannedCount  = (Object.values(data) as Entry[][]).flat().filter(e => e.planned).length;
  const verifiedCount = (Object.values(data) as Entry[][]).flat().filter(e => !e.planned && e.plannedAmount != null).length;

  const hasPending: Record<Category, boolean> = {
    income:   (data.income ?? []).some(e => e.planned),
    expenses: (data.expenses ?? []).some(e => e.planned),
    savings:  (data.savings ?? []).some(e => e.planned),
  };

  const apiBase = { year, month, category: activeTab };

  const callApi = useCallback(async (method: string, body: object) => {
    setLoading(true);
    try {
      const res = await fetch('/api/drive/entry', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...apiBase, ...body }),
      });
      if (!res.ok) throw new Error(await res.text());
    } finally {
      setLoading(false);
    }
  }, [year, month, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateLocal = (newEntries: Entry[]) =>
    setData(d => ({ ...d, [activeTab]: newEntries }));

  const handleAdd = async (entry: Entry) => {
    updateLocal([...entries, entry]);
    await callApi('POST', entry);
  };

  const handleEdit = async (entry: Entry) => {
    const idx = sheet.editIndex!;
    const updated = entries.map((e, i) => i === idx ? entry : e);
    updateLocal(updated);
    await callApi('PUT', { index: idx, ...entry });
  };

  const handleDelete = async (i: number) => {
    updateLocal(entries.filter((_, idx) => idx !== i));
    await callApi('DELETE', { index: i });
  };

  const handleToggleConstant = async (i: number) => {
    const newVal = !entries[i].constant;
    updateLocal(entries.map((e, idx) => idx === i ? { ...e, constant: newVal } : e));
    await callApi('PATCH', { index: i, constant: newVal });
  };

  const handleVerify = async (actualAmount: number) => {
    const i = verifySheet.index!;
    const plannedAmount = entries[i].amount;
    updateLocal(entries.map((e, idx) =>
      idx === i ? { ...e, amount: actualAmount, planned: false, plannedAmount } : e
    ));
    await callApi('PATCH', { index: i, amount: actualAmount, planned: false, plannedAmount });
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', position: 'relative', maxWidth: 600, margin: '0 auto' }}>
      <Header />
      <MonthPicker ym={ym} todayYm={todayYm} onChange={handleChangeMonth} />
      <SummaryCard income={data.income ?? []} expenses={data.expenses ?? []} savings={data.savings ?? []} isFuture={isFuture} />

      {showBanner && !isFuture && <ConstantBanner onDismiss={() => setShowBanner(false)} />}
      {isFuture && plannedCount > 0 && <PlannedBanner plannedCount={plannedCount} verifiedCount={verifiedCount} />}

      <CategoryTabs active={activeTab} onChange={setActiveTab} hasPending={hasPending} />

      {/* Entry list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {entries.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 40 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 22 }}>💸</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500 }}>No {catLabel.toLowerCase()} entries yet</div>
            {isFuture && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Add planned amounts to forecast this month</div>}
          </div>
        ) : (
          entries.map((entry, i) => (
            <EntryRow
              key={`${activeTab}-${i}`}
              entry={entry}
              index={i}
              color={catColor}
              onDelete={handleDelete}
              onToggleConstant={handleToggleConstant}
              onEdit={(i) => setSheet({ open: true, editIndex: i })}
              onVerify={(i) => setVerifySheet({ open: true, index: i })}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 14px 12px', borderTop: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Total {catLabel}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: catColor, letterSpacing: '-0.5px' }}>
              {fmt(catActual + catPlanned)}
            </div>
            {catPlanned > 0 && (
              <div style={{ fontSize: 11.5, color: 'var(--planned)', fontWeight: 500 }}>({fmt(catActual)} actual)</div>
            )}
          </div>
        </div>
        <button
          onClick={() => setSheet({ open: true, editIndex: null })}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 16px', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            background: catColor, color: 'white',
            fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13.5, fontWeight: 700,
            boxShadow: `0 3px 12px ${catColor}55`,
            opacity: loading ? 0.7 : 1,
          }}
        >
          <PlusIcon /> {isFuture ? 'Plan' : 'Add'}
        </button>
      </div>

      <EntrySheet
        visible={sheet.open}
        onClose={() => setSheet(s => ({ ...s, open: false }))}
        onSave={sheet.editIndex !== null ? handleEdit : handleAdd}
        editEntry={sheet.editIndex !== null ? entries[sheet.editIndex] : null}
        category={activeTab}
        isFuture={isFuture}
        currentYm={ym}
      />

      <VerifySheet
        visible={verifySheet.open}
        onClose={() => setVerifySheet(s => ({ ...s, open: false }))}
        entry={verifySheet.index !== null ? entries[verifySheet.index] : null}
        onVerify={handleVerify}
        color={catColor}
      />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/dashboard
git commit -m "feat: add DashboardClient with full entry CRUD and optimistic updates"
```

---

## Task 20: Dashboard server page

**Files:**
- Create: `app/dashboard/[year]/[month]/page.tsx`

- [ ] **Step 1: Create `app/dashboard/[year]/[month]/page.tsx`**

```tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getEntries, initMonth } from '@/lib/google-drive';
import type { MonthData } from '@/lib/types';
import { DashboardClient } from './DashboardClient';

interface Props {
  params: Promise<{ year: string; month: string }>;
}

export default async function DashboardPage({ params }: Props) {
  const { year, month } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) redirect('/sign-in');

  const wasNew = await initMonth(session.accessToken, year, month);

  const now = new Date();
  const todayYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const ym = `${year}-${month}`;
  const isFutureMth = ym > todayYm;

  const [income, expenses, savings] = await Promise.all([
    getEntries(session.accessToken, year, month, 'income'),
    getEntries(session.accessToken, year, month, 'expenses'),
    getEntries(session.accessToken, year, month, 'savings'),
  ]);

  // For future months, seed entries should be marked planned if not already
  const markPlanned = (entries: typeof income) =>
    isFutureMth ? entries.map(e => ({ ...e, planned: e.planned ?? true })) : entries;

  const initialData: MonthData = {
    income:   markPlanned(income),
    expenses: markPlanned(expenses),
    savings:  markPlanned(savings),
  };

  return (
    <DashboardClient
      year={year}
      month={month}
      todayYm={todayYm}
      initialData={initialData}
      wasNew={wasNew}
    />
  );
}
```

- [ ] **Step 2: Verify build compiles**

```bash
yarn build
```

Expected: Build completes with no TypeScript errors. There will be warnings about missing env vars — that's fine.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/\[year\]/\[month\]/page.tsx
git commit -m "feat: add dashboard server page with SSR data loading"
```

---

## Task 21: Final integration check

- [ ] **Step 1: Copy env template and fill in values**

```bash
cp .env.local.example .env.local
# Fill in NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
```

- [ ] **Step 2: Run dev server**

```bash
yarn dev
```

Expected: server starts at `http://localhost:3000`.

- [ ] **Step 3: Verify sign-in flow**

Navigate to `http://localhost:3000`. You should be redirected to `/sign-in`. Click "Continue with Google" and complete the OAuth flow. You should land on `/dashboard/YYYY/MM`.

- [ ] **Step 4: Verify dashboard renders**

Check:
- Balance card shows 0 or auto-populated values
- Three tabs (Income / Expenses / Savings) are present
- Month picker prev/next arrows work
- "Add" button opens the bottom sheet

- [ ] **Step 5: Verify add entry**

Tap "Add", fill in description + amount, save. Entry should appear in the list and the category total should update.

- [ ] **Step 6: Verify planned entry and verify flow**

Navigate to next month (should show "Forecast" subtitle and dark card). Tap "Plan", add an entry. The entry should appear gray with "planned" badge. Tap "Verify", enter actual amount, confirm. Entry should turn solid color with struck-through planned amount.

- [ ] **Step 7: Commit any final fixes**

```bash
git add -A
git commit -m "chore: final integration fixes"
```

---

---

## Task 22: Update globals.css with desktop CSS vars

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add missing desktop variables to `:root` block in `app/globals.css`**

Add these lines after `--border`:
```css
  --income-dim:  oklch(56% 0.08 145);
  --expense-dim: oklch(56% 0.09 22);
  --savings-dim: oklch(56% 0.08 240);
  --sidebar:     oklch(98% 0.004 60);
```

Also add the scrollbar styles after `@keyframes slideUp`:
```css
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
```

And add `@keyframes modalIn`:
```css
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "feat: add desktop CSS variables and modal keyframe"
```

---

## Task 23: Modal component (desktop dialogs)

**Files:**
- Create: `app/components/Modal.tsx`

- [ ] **Step 1: Create `app/components/Modal.tsx`**

```tsx
'use client';
import { useEffect } from 'react';

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
}

export function Modal({ visible, onClose, title, children, width = 440 }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (visible) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'oklch(0% 0 0 / 0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.15s ease' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width, background: 'var(--surface)', borderRadius: 16, boxShadow: '0 8px 40px oklch(0% 0 0 / 0.2)', animation: 'modalIn 0.2s cubic-bezier(0.4,0,0.2,1)', overflow: 'hidden' }}
      >
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 20, lineHeight: 1, padding: '0 2px', display: 'flex', alignItems: 'center' }}>×</button>
        </div>
        <div style={{ padding: '18px 20px 20px' }}>{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/Modal.tsx
git commit -m "feat: add Modal component for desktop dialogs"
```

---

## Task 24: SummaryBar component (desktop)

**Files:**
- Create: `app/components/SummaryBar.tsx`

The desktop design uses a horizontal summary bar (full-width strip) instead of the mobile's rounded card.

- [ ] **Step 1: Create `app/components/SummaryBar.tsx`**

```tsx
'use client';
import type { Entry } from '@/lib/types';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
const fmtShort = (n: number) => n >= 1000 ? '$' + (n / 1000).toFixed(1) + 'k' : '$' + n.toFixed(0);

const sumActual  = (arr: Entry[]) => arr.filter(e => !e.planned).reduce((a, b) => a + b.amount, 0);
const sumPlanned = (arr: Entry[]) => arr.filter(e => e.planned).reduce((a, b) => a + b.amount, 0);

interface Props {
  income:        Entry[];
  expenses:      Entry[];
  savings:       Entry[];
  isFutureMonth: boolean;
}

export function SummaryBar({ income, expenses, savings, isFutureMonth }: Props) {
  const aI = sumActual(income),  pI = sumPlanned(income);
  const aE = sumActual(expenses), pE = sumPlanned(expenses);
  const aS = sumActual(savings),  pS = sumPlanned(savings);
  const tI = aI + pI, tE = aE + pE, tS = aS + pS;
  const balance = tI - tE - tS;
  const total = tI || 1;

  const expPct = Math.min(100, (tE / total) * 100);
  const savPct = Math.min(100, (tS / total) * 100);
  const incPct = Math.max(0, 100 - expPct - savPct);

  return (
    <div style={{
      background: isFutureMonth
        ? 'linear-gradient(135deg, oklch(22% 0.04 250), oklch(17% 0.02 260))'
        : 'var(--text)',
      padding: '16px 28px',
      display: 'flex',
      alignItems: 'center',
      gap: 32,
      flexShrink: 0,
      outline: isFutureMonth ? '1.5px dashed oklch(50% 0.12 250 / 0.35)' : 'none',
      outlineOffset: '-1px',
    }}>
      {/* Balance */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: 'oklch(100% 0 0 / 0.45)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
          {isFutureMonth ? 'Projected balance' : 'Balance'}
          {isFutureMonth && (
            <span style={{ fontSize: 8.5, fontWeight: 700, background: 'oklch(100% 0 0 / 0.1)', padding: '1px 5px', borderRadius: 3, letterSpacing: '0.06em' }}>FORECAST</span>
          )}
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.8px', color: balance < 0 ? 'oklch(70% 0.18 22)' : 'white' }}>
          {fmt(balance)}
        </div>
      </div>

      {/* Bar + legend */}
      <div style={{ flex: 1 }}>
        <div style={{ height: 6, borderRadius: 3, background: 'oklch(100% 0 0 / 0.12)', overflow: 'hidden', display: 'flex', marginBottom: 8 }}>
          <div style={{ width: `${incPct}%`, background: 'var(--income-mid)', transition: 'width 0.5s' }} />
          <div style={{ width: `${expPct}%`, background: 'var(--expense-mid)', transition: 'width 0.5s' }} />
          <div style={{ width: `${savPct}%`, background: 'var(--savings-mid)', transition: 'width 0.5s' }} />
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {([
            { label: 'Income',   actual: aI, planned: pI, dot: 'var(--income-mid)'  },
            { label: 'Expenses', actual: aE, planned: pE, dot: 'var(--expense-mid)' },
            { label: 'Savings',  actual: aS, planned: pS, dot: 'var(--savings-mid)' },
          ] as const).map(({ label, actual, planned, dot }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: dot, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: 'oklch(100% 0 0 / 0.5)', fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 12, color: 'white', fontWeight: 700 }}>{fmtShort(actual + planned)}</span>
              {isFutureMonth && planned > 0 && (
                <span style={{ fontSize: 10, color: 'oklch(100% 0 0 / 0.35)', fontWeight: 500 }}>({fmtShort(actual)} actual)</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/SummaryBar.tsx
git commit -m "feat: add SummaryBar component for desktop layout"
```

---

## Task 25: DesktopEntryRow component

**Files:**
- Create: `app/components/DesktopEntryRow.tsx`

Desktop rows use hover (not swipe) to reveal actions, and a grid layout.

- [ ] **Step 1: Create `app/components/DesktopEntryRow.tsx`**

```tsx
'use client';
import { useState } from 'react';
import type { Entry } from '@/lib/types';
import { PinIcon, TrashIcon, EditIcon, CheckIcon } from './icons';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

interface Props {
  entry: Entry;
  index: number;
  color: string;
  onDelete: (i: number) => void;
  onToggleConstant: (i: number) => void;
  onEdit: (i: number) => void;
  onVerify: (i: number) => void;
}

export function DesktopEntryRow({ entry, index, color, onDelete, onToggleConstant, onEdit, onVerify }: Props) {
  const [hovered, setHovered] = useState(false);
  const isPlanned = entry.planned;
  const hasPlannedRecord = !isPlanned && entry.plannedAmount != null;
  const amountChanged = hasPlannedRecord && entry.plannedAmount !== entry.amount;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '20px 1fr auto auto',
        alignItems: 'center',
        gap: 8,
        padding: '7px 10px',
        borderRadius: 8,
        background: isPlanned ? 'var(--planned-bg)' : (hovered ? 'var(--bg)' : 'transparent'),
        borderLeft: isPlanned ? '2px dashed var(--planned-border)' : '2px solid transparent',
        transition: 'background 0.1s',
        cursor: 'default',
      }}
    >
      {/* Pin */}
      <button
        onClick={() => onToggleConstant(index)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', opacity: isPlanned ? 0.5 : 1, borderRadius: 4 }}
      >
        <PinIcon active={entry.constant} color={isPlanned ? 'var(--planned)' : color} />
      </button>

      {/* Info */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: isPlanned ? 'var(--planned)' : 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {entry.description}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
          <span>{entry.date.slice(5).replace('-', '/')}</span>
          {entry.constant && <span style={{ color: isPlanned ? 'var(--planned)' : color, fontWeight: 600, fontSize: 10 }}>recurring</span>}
          {isPlanned && <span style={{ color: 'var(--planned)', fontWeight: 600, fontSize: 10, background: 'oklch(88% 0.004 260)', padding: '1px 5px', borderRadius: 3 }}>planned</span>}
        </div>
      </div>

      {/* Amount */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: isPlanned ? 'var(--planned)' : color }}>
          {fmt(entry.amount)}
        </div>
        {hasPlannedRecord && amountChanged && (
          <div style={{ fontSize: 10, color: 'var(--text-3)', textDecoration: 'line-through', textDecorationColor: 'oklch(80% 0 0)' }}>
            {fmt(entry.plannedAmount!)}
          </div>
        )}
        {hasPlannedRecord && !amountChanged && (
          <div style={{ fontSize: 10, color: 'var(--text-3)' }}>as planned</div>
        )}
      </div>

      {/* Actions (hover) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, opacity: hovered ? 1 : 0, transition: 'opacity 0.15s', flexShrink: 0 }}>
        {isPlanned ? (
          <button
            onClick={() => onVerify(index)}
            title="Verify"
            style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 7px', borderRadius: 6, background: 'oklch(92% 0.005 260)', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            <CheckIcon /> Verify
          </button>
        ) : (
          <button
            onClick={() => onEdit(index)}
            title="Edit"
            style={{ width: 26, height: 26, borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}
          >
            <EditIcon />
          </button>
        )}
        <button
          onClick={() => onDelete(index)}
          title="Delete"
          style={{ width: 26, height: 26, borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/DesktopEntryRow.tsx
git commit -m "feat: add DesktopEntryRow with hover actions"
```

---

## Task 26: CategoryColumn component (desktop 3-col layout)

**Files:**
- Create: `app/components/CategoryColumn.tsx`

- [ ] **Step 1: Create `app/components/CategoryColumn.tsx`**

```tsx
'use client';
import type { Category, Entry } from '@/lib/types';
import { DesktopEntryRow } from './DesktopEntryRow';
import { PlusIcon } from './icons';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

const sumActual  = (arr: Entry[]) => arr.filter(e => !e.planned).reduce((a, b) => a + b.amount, 0);
const sumPlanned = (arr: Entry[]) => arr.filter(e => e.planned).reduce((a, b) => a + b.amount, 0);

interface CatDef {
  key: Category;
  label: string;
  color: string;
  light: string;
}

interface Props {
  cat: CatDef;
  entries: Entry[];
  isFutureMonth: boolean;
  onAdd: () => void;
  onEdit: (i: number) => void;
  onDelete: (i: number) => void;
  onToggleConstant: (i: number) => void;
  onVerify: (i: number) => void;
}

export function CategoryColumn({ cat, entries, isFutureMonth, onAdd, onEdit, onDelete, onToggleConstant, onVerify }: Props) {
  const actual  = sumActual(entries);
  const planned = sumPlanned(entries);
  const hasPending = entries.some(e => e.planned);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: '1px solid var(--border)' }}>
      {/* Column header */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '0.02em' }}>{cat.label}</span>
          {hasPending && (
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--planned)', background: 'oklch(92% 0.003 260)', padding: '1px 6px', borderRadius: 4 }}>
              {entries.filter(e => e.planned).length} planned
            </span>
          )}
        </div>
        <button
          onClick={onAdd}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: 'none', background: cat.light, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: cat.color, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          <PlusIcon /> {isFutureMonth ? 'Plan' : 'Add'}
        </button>
      </div>

      {/* Entries */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
        {entries.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 12.5 }}>
            {isFutureMonth ? `Plan expected ${cat.label.toLowerCase()}` : `No ${cat.label.toLowerCase()} yet`}
          </div>
        ) : (
          entries.map((entry, i) => (
            <DesktopEntryRow
              key={`${cat.key}-${i}`}
              entry={entry}
              index={i}
              color={cat.color}
              onDelete={onDelete}
              onEdit={onEdit}
              onToggleConstant={onToggleConstant}
              onVerify={onVerify}
            />
          ))
        )}
      </div>

      {/* Footer total */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</span>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: cat.color, letterSpacing: '-0.4px' }}>{fmt(actual + planned)}</div>
          {planned > 0 && <div style={{ fontSize: 10.5, color: 'var(--planned)', fontWeight: 500 }}>{fmt(actual)} actual</div>}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/CategoryColumn.tsx
git commit -m "feat: add CategoryColumn for desktop 3-column layout"
```

---

## Task 27: Add EntryForm component (shared desktop form)

**Files:**
- Create: `app/components/EntryForm.tsx`

Desktop uses a shared form inside a Modal (not a bottom sheet). This is also reused for Add and Edit.

- [ ] **Step 1: Create `app/components/EntryForm.tsx`**

```tsx
'use client';
import { useEffect, useState } from 'react';
import type { Category, Entry } from '@/lib/types';

interface CatDef {
  key: Category;
  label: string;
  color: string;
}

interface FormState {
  date: string;
  amount: string;
  description: string;
  constant: boolean;
  planned: boolean;
}

interface Props {
  initial?: FormState | null;
  onSave: (entry: Entry) => void;
  onCancel: () => void;
  cat: CatDef;
  isFutureMonth: boolean;
  submitLabel?: string;
}

function Toggle({ value, onChange, color, label, sub }: { value: boolean; onChange: () => void; color: string; label: string; sub: string }) {
  return (
    <div
      onClick={onChange}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'var(--bg)', borderRadius: 8, cursor: 'pointer', userSelect: 'none' }}
    >
      <div style={{ width: 36, height: 20, borderRadius: 10, background: value ? color : 'var(--border)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 2, left: value ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px oklch(0% 0 0 / 0.2)' }} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{sub}</div>
      </div>
    </div>
  );
}

export function EntryForm({ initial, onSave, onCancel, cat, isFutureMonth, submitLabel }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<FormState>(
    initial ?? { date: today, amount: '', description: '', constant: false, planned: isFutureMonth }
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    setForm(initial ?? { date: today, amount: '', description: '', constant: false, planned: isFutureMonth });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.description.trim()) e.description = 'Required';
    if (!form.amount || isNaN(+form.amount) || +form.amount <= 0) e.amount = 'Enter a valid amount';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const inp = (err?: string) => ({
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: `1.5px solid ${err ? 'var(--expense)' : 'var(--border)'}`,
    fontSize: 13.5, fontFamily: 'Plus Jakarta Sans, sans-serif',
    color: 'var(--text)', background: 'var(--bg)', outline: 'none', transition: 'border-color 0.15s',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>Description</label>
        <input
          style={inp(errors.description)}
          placeholder="e.g. Monthly Salary"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          autoFocus
        />
        {errors.description && <div style={{ fontSize: 11, color: 'var(--expense)', marginTop: 2 }}>{errors.description}</div>}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>Amount ($)</label>
          <input
            type="number" min="0" step="0.01"
            style={inp(errors.amount)}
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          />
          {errors.amount && <div style={{ fontSize: 11, color: 'var(--expense)', marginTop: 2 }}>{errors.amount}</div>}
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>Date</label>
          <input
            type="date"
            style={inp()}
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          />
        </div>
      </div>
      <Toggle value={form.planned} onChange={() => setForm((f) => ({ ...f, planned: !f.planned }))} color="var(--planned)" label="Planned entry" sub="Expected amount — verify when it happens" />
      <Toggle value={form.constant} onChange={() => setForm((f) => ({ ...f, constant: !f.constant }))} color={cat.color} label="Recurring entry" sub="Carry over to next month" />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          onClick={onCancel}
          style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          Cancel
        </button>
        <button
          onClick={() => { if (validate()) onSave({ ...form, amount: parseFloat(form.amount) }); }}
          style={{ flex: 2, padding: '10px', borderRadius: 8, border: 'none', background: form.planned ? 'var(--planned)' : cat.color, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          {submitLabel ?? (form.planned ? 'Add as planned' : 'Add entry')}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/EntryForm.tsx
git commit -m "feat: add EntryForm component for desktop modals"
```

---

## Task 28: Update DashboardClient to support responsive desktop layout

**Files:**
- Modify: `app/dashboard/[year]/[month]/DashboardClient.tsx`

Replace the current DashboardClient with a version that renders either mobile layout (tabs + bottom-sheets) or desktop layout (3-col + modals) based on `window.innerWidth >= 768`.

- [ ] **Step 1: Replace `app/dashboard/[year]/[month]/DashboardClient.tsx`**

```tsx
'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Category, Entry, MonthData } from '@/lib/types';
import { Header } from '@/app/components/Header';
import { MonthPicker } from '@/app/components/MonthPicker';
import { SummaryCard } from '@/app/components/SummaryCard';
import { SummaryBar } from '@/app/components/SummaryBar';
import { CategoryTabs } from '@/app/components/CategoryTabs';
import { CategoryColumn } from '@/app/components/CategoryColumn';
import { EntryRow } from '@/app/components/EntryRow';
import { EntrySheet } from '@/app/components/EntrySheet';
import { VerifySheet } from '@/app/components/VerifySheet';
import { Modal } from '@/app/components/Modal';
import { EntryForm } from '@/app/components/EntryForm';
import { ConstantBanner } from '@/app/components/ConstantBanner';
import { PlannedBanner } from '@/app/components/PlannedBanner';
import { PlusIcon } from '@/app/components/icons';
import { CATEGORIES } from '@/lib/types';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

const CAT_DEFS = [
  { key: 'income'   as Category, label: 'Income',   color: 'var(--income)',   light: 'var(--income-light)'   },
  { key: 'expenses' as Category, label: 'Expenses', color: 'var(--expense)',  light: 'var(--expense-light)'  },
  { key: 'savings'  as Category, label: 'Savings',  color: 'var(--savings)',  light: 'var(--savings-light)'  },
];

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const update = () => setIsDesktop(window.innerWidth >= 768);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return isDesktop;
}

interface Props {
  year: string;
  month: string;
  todayYm: string;
  initialData: MonthData;
  wasNew: boolean;
}

export function DashboardClient({ year, month, todayYm, initialData, wasNew }: Props) {
  const router  = useRouter();
  const ym      = `${year}-${month}`;
  const isFuture = ym > todayYm;
  const isDesktop = useIsDesktop();

  const [data, setData] = useState<MonthData>(initialData);
  const [activeTab, setActiveTab] = useState<Category>('income');
  const [showBanner, setShowBanner] = useState(wasNew && !isFuture);
  const [loading, setLoading] = useState(false);

  // Mobile sheets
  const [sheet, setSheet] = useState<{ open: boolean; editIndex: number | null }>({ open: false, editIndex: null });
  const [verifySheet, setVerifySheet] = useState<{ open: boolean; index: number | null }>({ open: false, index: null });

  // Desktop modals
  const [addModal,    setAddModal]    = useState<{ open: boolean; category: Category | null }>({ open: false, category: null });
  const [editModal,   setEditModal]   = useState<{ open: boolean; category: Category | null; index: number | null }>({ open: false, category: null, index: null });
  const [verifyModal, setVerifyModal] = useState<{ open: boolean; category: Category | null; index: number | null }>({ open: false, category: null, index: null });

  const getEntries = (cat: Category): Entry[] => data[cat] ?? [];
  const setEntries = (cat: Category, entries: Entry[]) =>
    setData(d => ({ ...d, [cat]: entries }));

  const handleChangeMonth = (newYm: string) => {
    const [y, m] = newYm.split('-');
    router.push(`/dashboard/${y}/${m}`);
  };

  const apiBase = useCallback((cat: Category) => ({ year, month, category: cat }), [year, month]);

  const callApi = useCallback(async (method: string, cat: Category, body: object) => {
    setLoading(true);
    try {
      const res = await fetch('/api/drive/entry', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...apiBase(cat), ...body }),
      });
      if (!res.ok) throw new Error(await res.text());
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  // --- Mobile active-tab operations ---
  const mobileEntries = getEntries(activeTab);
  const mobileCatColor = CAT_DEFS.find(c => c.key === activeTab)!.color;

  const handleMobileAdd = async (entry: Entry) => {
    setEntries(activeTab, [...mobileEntries, entry]);
    await callApi('POST', activeTab, entry);
  };
  const handleMobileEdit = async (entry: Entry) => {
    const idx = sheet.editIndex!;
    setEntries(activeTab, mobileEntries.map((e, i) => i === idx ? entry : e));
    await callApi('PUT', activeTab, { index: idx, ...entry });
  };
  const handleMobileDelete = async (i: number) => {
    setEntries(activeTab, mobileEntries.filter((_, idx) => idx !== i));
    await callApi('DELETE', activeTab, { index: i });
  };
  const handleMobileToggleConstant = async (i: number) => {
    const newVal = !mobileEntries[i].constant;
    setEntries(activeTab, mobileEntries.map((e, idx) => idx === i ? { ...e, constant: newVal } : e));
    await callApi('PATCH', activeTab, { index: i, constant: newVal });
  };
  const handleMobileVerify = async (actualAmount: number) => {
    const i = verifySheet.index!;
    const plannedAmount = mobileEntries[i].amount;
    setEntries(activeTab, mobileEntries.map((e, idx) =>
      idx === i ? { ...e, amount: actualAmount, planned: false, plannedAmount } : e
    ));
    await callApi('PATCH', activeTab, { index: i, amount: actualAmount, planned: false, plannedAmount });
  };

  // --- Desktop per-category operations ---
  const handleDesktopAdd = async (cat: Category, entry: Entry) => {
    setEntries(cat, [...getEntries(cat), entry]);
    await callApi('POST', cat, entry);
  };
  const handleDesktopEdit = async (cat: Category, idx: number, entry: Entry) => {
    setEntries(cat, getEntries(cat).map((e, i) => i === idx ? entry : e));
    await callApi('PUT', cat, { index: idx, ...entry });
  };
  const handleDesktopDelete = async (cat: Category, i: number) => {
    setEntries(cat, getEntries(cat).filter((_, idx) => idx !== i));
    await callApi('DELETE', cat, { index: i });
  };
  const handleDesktopToggleConstant = async (cat: Category, i: number) => {
    const newVal = !getEntries(cat)[i].constant;
    setEntries(cat, getEntries(cat).map((e, idx) => idx === i ? { ...e, constant: newVal } : e));
    await callApi('PATCH', cat, { index: i, constant: newVal });
  };
  const handleDesktopVerify = async (cat: Category, i: number, actualAmount: number) => {
    const plannedAmount = getEntries(cat)[i].amount;
    setEntries(cat, getEntries(cat).map((e, idx) =>
      idx === i ? { ...e, amount: actualAmount, planned: false, plannedAmount } : e
    ));
    await callApi('PATCH', cat, { index: i, amount: actualAmount, planned: false, plannedAmount });
  };

  const plannedCount  = (Object.values(data) as Entry[][]).flat().filter(e => e.planned).length;
  const verifiedCount = (Object.values(data) as Entry[][]).flat().filter(e => !e.planned && e.plannedAmount != null).length;
  const hasPending: Record<Category, boolean> = {
    income:   getEntries('income').some(e => e.planned),
    expenses: getEntries('expenses').some(e => e.planned),
    savings:  getEntries('savings').some(e => e.planned),
  };

  const mobileActual  = mobileEntries.filter(e => !e.planned).reduce((a, b) => a + b.amount, 0);
  const mobilePlanned = mobileEntries.filter(e => e.planned).reduce((a, b) => a + b.amount, 0);

  /* ── Desktop layout ─────────────────────────────────────── */
  if (isDesktop) {
    const addCat  = CAT_DEFS.find(c => c.key === addModal.category);
    const editCat = CAT_DEFS.find(c => c.key === editModal.category);
    const verifyCat = CAT_DEFS.find(c => c.key === verifyModal.category);

    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        {/* Top nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
                <path d="M8 22 L16 10 L24 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="10" y1="18" x2="22" y2="18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>budgetMe</span>
          </div>

          {/* Month picker (inline in nav) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => { const [y,m] = (ym.split('-').map((v,i) => i===0?v:v)); const prev = `${+y+(+m===1?-1:0)}-${+m===1?'12':String(+m-1).padStart(2,'0')}`; handleChangeMonth(prev); }}
              style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
            </button>
            <div style={{ textAlign: 'center', minWidth: 140 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                  {['January','February','March','April','May','June','July','August','September','October','November','December'][parseInt(month)-1]} {year}
                </span>
                {isFuture && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'oklch(48% 0.1 250)', background: 'oklch(93% 0.04 250)', padding: '2px 7px', borderRadius: 5, letterSpacing: '0.04em' }}>Forecast</span>
                )}
              </div>
            </div>
            <button
              onClick={() => { const next = `${+year+(+month===12?1:0)}-${+month===12?'01':String(+month+1).padStart(2,'0')}`; handleChangeMonth(next); }}
              style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,18 15,12 9,6"/></svg>
            </button>
            {ym !== todayYm && (
              <button
                onClick={() => handleChangeMonth(todayYm)}
                style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', fontFamily: 'Plus Jakarta Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="7" x2="12" y2="12"/><line x1="12" y1="12" x2="16" y2="14"/></svg>
                Today
              </button>
            )}
          </div>

          <button onClick={() => { /* sign out via Header */ }} style={{ border: '1px solid var(--border)', background: 'none', borderRadius: 7, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit' }}>
            Sign out
          </button>
        </div>

        <SummaryBar income={data.income??[]} expenses={data.expenses??[]} savings={data.savings??[]} isFutureMonth={isFuture} />

        {/* 3-column layout */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {CAT_DEFS.map(cat => (
            <CategoryColumn
              key={cat.key}
              cat={cat}
              entries={getEntries(cat.key)}
              isFutureMonth={isFuture}
              onAdd={() => setAddModal({ open: true, category: cat.key })}
              onEdit={(i) => setEditModal({ open: true, category: cat.key, index: i })}
              onDelete={(i) => handleDesktopDelete(cat.key, i)}
              onToggleConstant={(i) => handleDesktopToggleConstant(cat.key, i)}
              onVerify={(i) => setVerifyModal({ open: true, category: cat.key, index: i })}
            />
          ))}
        </div>

        {/* Add modal */}
        {addModal.open && addCat && (
          <Modal visible={true} onClose={() => setAddModal({ open: false, category: null })} title={`Add ${addCat.label} entry`} width={420}>
            <EntryForm
              cat={addCat}
              isFutureMonth={isFuture}
              onCancel={() => setAddModal({ open: false, category: null })}
              onSave={(e) => { handleDesktopAdd(addModal.category!, e); setAddModal({ open: false, category: null }); }}
            />
          </Modal>
        )}

        {/* Edit modal */}
        {editModal.open && editCat && editModal.index !== null && (() => {
          const entry = getEntries(editModal.category!)[editModal.index];
          return (
            <Modal visible={true} onClose={() => setEditModal({ open: false, category: null, index: null })} title={`Edit ${editCat.label} entry`} width={420}>
              <EntryForm
                cat={editCat}
                isFutureMonth={isFuture}
                initial={{ ...entry, amount: String(entry.amount) }}
                submitLabel="Save changes"
                onCancel={() => setEditModal({ open: false, category: null, index: null })}
                onSave={(e) => { handleDesktopEdit(editModal.category!, editModal.index!, e); setEditModal({ open: false, category: null, index: null }); }}
              />
            </Modal>
          );
        })()}

        {/* Verify modal */}
        {verifyModal.open && verifyCat && verifyModal.index !== null && (() => {
          const entry = getEntries(verifyModal.category!)[verifyModal.index];
          return (
            <Modal visible={true} onClose={() => setVerifyModal({ open: false, category: null, index: null })} title="Verify entry" width={380}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{entry.description}</div>
                <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--planned-bg)', border: '1px dashed var(--planned-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--planned)', fontWeight: 500 }}>Planned amount</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--planned)' }}>{fmt(entry.amount)}</span>
                </div>
                <VerifyModalForm
                  entry={entry}
                  color={verifyCat.color}
                  onClose={() => setVerifyModal({ open: false, category: null, index: null })}
                  onVerify={(amt) => { handleDesktopVerify(verifyModal.category!, verifyModal.index!, amt); setVerifyModal({ open: false, category: null, index: null }); }}
                />
              </div>
            </Modal>
          );
        })()}
      </div>
    );
  }

  /* ── Mobile layout ──────────────────────────────────────── */
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', position: 'relative' }}>
      <Header />
      <MonthPicker ym={ym} todayYm={todayYm} onChange={handleChangeMonth} />
      <SummaryCard income={data.income ?? []} expenses={data.expenses ?? []} savings={data.savings ?? []} isFuture={isFuture} />

      {showBanner && !isFuture && <ConstantBanner onDismiss={() => setShowBanner(false)} />}
      {isFuture && plannedCount > 0 && <PlannedBanner plannedCount={plannedCount} verifiedCount={verifiedCount} />}

      <CategoryTabs active={activeTab} onChange={setActiveTab} hasPending={hasPending} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {mobileEntries.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 40 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 22 }}>💸</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500 }}>No {CAT_DEFS.find(c=>c.key===activeTab)!.label.toLowerCase()} entries yet</div>
            {isFuture && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Add planned amounts to forecast this month</div>}
          </div>
        ) : (
          mobileEntries.map((entry, i) => (
            <EntryRow
              key={`${activeTab}-${i}`}
              entry={entry}
              index={i}
              color={mobileCatColor}
              onDelete={handleMobileDelete}
              onToggleConstant={handleMobileToggleConstant}
              onEdit={(i) => setSheet({ open: true, editIndex: i })}
              onVerify={(i) => setVerifySheet({ open: true, index: i })}
            />
          ))
        )}
      </div>

      <div style={{ padding: '10px 14px 12px', borderTop: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Total {CAT_DEFS.find(c=>c.key===activeTab)!.label}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: mobileCatColor, letterSpacing: '-0.5px' }}>
              {fmt(mobileActual + mobilePlanned)}
            </div>
            {mobilePlanned > 0 && (
              <div style={{ fontSize: 11.5, color: 'var(--planned)', fontWeight: 500 }}>({fmt(mobileActual)} actual)</div>
            )}
          </div>
        </div>
        <button
          onClick={() => setSheet({ open: true, editIndex: null })}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: mobileCatColor, color: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13.5, fontWeight: 700, boxShadow: `0 3px 12px ${mobileCatColor}55`, opacity: loading ? 0.7 : 1 }}
        >
          <PlusIcon /> {isFuture ? 'Plan' : 'Add'}
        </button>
      </div>

      <EntrySheet
        visible={sheet.open}
        onClose={() => setSheet(s => ({ ...s, open: false }))}
        onSave={sheet.editIndex !== null ? handleMobileEdit : handleMobileAdd}
        editEntry={sheet.editIndex !== null ? mobileEntries[sheet.editIndex] : null}
        category={activeTab}
        isFuture={isFuture}
        currentYm={ym}
      />

      <VerifySheet
        visible={verifySheet.open}
        onClose={() => setVerifySheet(s => ({ ...s, open: false }))}
        entry={verifySheet.index !== null ? mobileEntries[verifySheet.index] : null}
        onVerify={handleMobileVerify}
        color={mobileCatColor}
      />
    </div>
  );
}

/* Desktop verify form (inline inside Modal) */
function VerifyModalForm({ entry, color, onClose, onVerify }: { entry: Entry; color: string; onClose: () => void; onVerify: (amount: number) => void }) {
  const [amount, setAmount] = useState(String(entry.amount));
  const [error, setError] = useState('');
  const fmt2 = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

  const handle = () => {
    if (!amount || isNaN(+amount) || +amount <= 0) { setError('Enter a valid amount'); return; }
    onVerify(parseFloat(amount));
  };

  return (
    <>
      <div>
        <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>Actual amount ($)</label>
        <input
          type="number" min="0" step="0.01" autoFocus
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${error ? 'var(--expense)' : 'var(--border)'}`, fontSize: 16, fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif', color: 'var(--text)', background: 'var(--bg)', outline: 'none', textAlign: 'center', letterSpacing: '-0.3px' }}
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handle()}
        />
        {error && <div style={{ fontSize: 11, color: 'var(--expense)', marginTop: 2 }}>{error}</div>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Keep planned</button>
        <button onClick={handle} style={{ flex: 2, padding: '10px', borderRadius: 8, border: 'none', background: color, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>
          Verify
        </button>
      </div>
    </>
  );
}
```

Note: the desktop sign-out button in the nav calls `signOut` — update the inline button to import and use `signOut` from `next-auth/react`:

Add at the top of the file:
```tsx
import { signOut } from 'next-auth/react';
```

And change the sign-out button's `onClick`:
```tsx
onClick={() => signOut({ callbackUrl: '/sign-in' })}
```

- [ ] **Step 2: Verify the build compiles**

```bash
yarn build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard app/components
git commit -m "feat: add responsive desktop layout with 3-column view and modals"
```

---

## Task 29: Final integration check (updated)

- [ ] **Step 1: Run dev server and test mobile layout (< 768px)**

Resize browser to mobile width. Verify:
- Tab navigation (Income/Expenses/Savings)
- Bottom-sheet opens when Add is tapped
- Swipe left on entry reveals Edit/Delete
- MonthPicker shows "Today" chip when navigated away
- Future month shows dark SummaryCard + "FORECAST" badge

- [ ] **Step 2: Test desktop layout (>= 768px)**

Resize browser to desktop width. Verify:
- 3-column layout with Income/Expenses/Savings side by side
- Horizontal SummaryBar at top
- Month picker inline in nav bar
- Hover on entry reveals actions
- Add button opens Modal (centered, not bottom-sheet)
- Verify button on planned entry opens Modal

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "chore: final responsive layout fixes"
```

---

## Self-Review Notes

**Spec coverage:**
- ✅ Sign-in screen with Google OAuth
- ✅ Dashboard at `/dashboard/[year]/[month]`
- ✅ Month navigation with prev/next, Today button (both mobile and desktop)
- ✅ Mobile: Summary card with balance bar (rounded dark card)
- ✅ Desktop: Summary bar (full-width horizontal strip)
- ✅ Forecast mode (dark/dashed card, FORECAST badge, projected balance)
- ✅ Mobile: Three category tabs with color coding, bottom sheets, swipe gestures
- ✅ Desktop: Three category columns side by side, hover actions, modal dialogs
- ✅ Entry rows with pin toggle, edit, delete
- ✅ `constant` toggle with recurring copy logic
- ✅ Planned entries (`planned: true`) — gray style, dashed border, planned badge
- ✅ Verify flow — stores `plannedAmount`, turns entry actual
- ✅ After verification: struck-through planned amount or "as planned"
- ✅ ConstantBanner when month was auto-populated (mobile)
- ✅ PlannedBanner in forecast mode (mobile)
- ✅ CSS custom properties matching design color scheme (oklch)
- ✅ Plus Jakarta Sans font
- ✅ Google Drive CSV storage with 6 columns incl. planned/plannedAmount
- ✅ NextAuth JWT with access_token + refresh_token persistence
- ✅ All API routes (GET entries, POST/PUT/PATCH/DELETE entry)
- ✅ Optimistic UI updates in DashboardClient
- ✅ Responsive breakpoint at 768px with `useIsDesktop` hook

**Type consistency verified:** `Entry`, `MonthData`, `Category` used consistently across lib, API routes, and all components. `CAT_DEFS` array type-safe with `as Category` casts.
