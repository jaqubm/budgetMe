# Savings Balance Chain + "From Savings" Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dynamic savings pool balance that carries forward across months, and let income/expense entries be tagged as drawing from that pool, with both balances displayed in the Summary components.

**Architecture:** A `savings_closing.txt` file per month folder stores the closing savings pool balance; every entry mutation rewrites it; `initAndGetMonth` reads the previous month's file to derive `openingSavings`; a new `fromSavings` boolean on `Entry` drives the deduction logic.

**Tech Stack:** Next.js App Router, TypeScript, Google Drive API (googleapis), Vitest for unit tests, Tailwind-adjacent inline styles.

---

## File Map

| File | Change |
|---|---|
| `lib/types.ts` | Add `fromSavings?: boolean` to `Entry`; add `openingSavings: number` to `MonthData` |
| `lib/csv.ts` | Add `fromSavings` column to header, parse, and serialize |
| `lib/csv.test.ts` | Update existing snapshots + add `fromSavings` tests |
| `lib/google-drive.ts` | Add `readSavingsClosing`, `writeSavingsClosing`, `recomputeAndWriteSavingsClosing`; update `initAndGetMonth` |
| `app/api/drive/entry/route.ts` | Fire-and-forget `recomputeAndWriteSavingsClosing` after every mutation |
| `app/lib/i18n.ts` | Add 4 translation strings (`fromSavings`, `fromSavingsSub`, `savingsBalance`, `prevMonthSavings`) |
| `app/components/SummaryCard.tsx` | Add `openingSavings` prop + savings balance block on the right |
| `app/components/SummaryBar.tsx` | Add `openingSavings` prop + savings balance block on the right |
| `app/components/EntryForm.tsx` | Add `fromSavings` to `FormState` + conditional toggle |
| `app/components/EntrySheet.tsx` | Add `fromSavings` to `FormState` + conditional toggle |
| `app/components/EntryRow.tsx` | Show savings badge when `entry.fromSavings` |
| `app/components/DesktopEntryRow.tsx` | Show savings badge when `entry.fromSavings` |
| `app/dashboard/[year]/[month]/page.tsx` | Destructure `openingSavings` from `initAndGetMonth`; include in `MonthData` |
| `app/dashboard/[year]/[month]/DashboardClient.tsx` | Pass `openingSavings={data.openingSavings}` to both Summary components |

---

## Task 1: Data model + CSV layer

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/csv.ts`
- Modify: `lib/csv.test.ts`

- [ ] **Step 1: Update `lib/types.ts`**

Replace the full file content:

```typescript
export type Category = 'income' | 'expenses' | 'savings';

export interface Entry {
  date: string;         // YYYY-MM-DD
  amount: number;
  description: string;
  constant: boolean;
  planned: boolean;
  plannedAmount?: number; // set after verification
  fromSavings?: boolean;  // draws from the savings pool (income and expenses only)
}

export interface MonthData {
  income: Entry[];
  expenses: Entry[];
  savings: Entry[];
  startBalance: number;
  openingSavings: number; // previous month's closing savings pool balance
}

export const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'income',   label: 'Income'   },
  { key: 'expenses', label: 'Expenses' },
  { key: 'savings',  label: 'Savings'  },
];
```

- [ ] **Step 2: Update `lib/csv.ts`**

Replace the full file content:

```typescript
import type { Entry } from './types';

const HEADER = 'date,amount,description,constant,planned,plannedAmount,fromSavings';

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
      fromSavings:   get('fromSavings') === 'true',
    };
  });
}

export function serializeCSV(entries: Entry[]): string {
  const rows = entries.map((e) =>
    [
      e.date,
      e.amount.toFixed(2),
      e.description.replace(/,/g, ';'),
      e.constant,
      e.planned,
      e.plannedAmount != null ? e.plannedAmount.toFixed(2) : '',
      e.fromSavings ? 'true' : 'false',
    ].join(',')
  );
  return [HEADER, ...rows].join('\n') + '\n';
}
```

- [ ] **Step 3: Update `lib/csv.test.ts`**

Replace the full file content (existing tests updated to include `fromSavings: false`; new tests added):

```typescript
import { describe, it, expect } from 'vitest';
import { parseCSV, serializeCSV } from './csv';

describe('parseCSV', () => {
  it('parses header-only CSV to empty array', () => {
    const csv = 'date,amount,description,constant,planned,plannedAmount,fromSavings\n';
    expect(parseCSV(csv)).toEqual([]);
  });

  it('parses a basic entry', () => {
    const csv = [
      'date,amount,description,constant,planned,plannedAmount,fromSavings',
      '2026-04-01,5000.00,Salary,true,false,,false',
    ].join('\n');
    expect(parseCSV(csv)).toEqual([{
      date: '2026-04-01',
      amount: 5000,
      description: 'Salary',
      constant: true,
      planned: false,
      plannedAmount: undefined,
      fromSavings: false,
    }]);
  });

  it('parses a verified planned entry', () => {
    const csv = [
      'date,amount,description,constant,planned,plannedAmount,fromSavings',
      '2026-05-01,5100.00,Salary,true,false,5000.00,false',
    ].join('\n');
    expect(parseCSV(csv)).toEqual([{
      date: '2026-05-01',
      amount: 5100,
      description: 'Salary',
      constant: true,
      planned: false,
      plannedAmount: 5000,
      fromSavings: false,
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
      fromSavings: false,
    }]);
  });

  it('parses fromSavings: true', () => {
    const csv = [
      'date,amount,description,constant,planned,plannedAmount,fromSavings',
      '2026-04-10,200.00,Car repair,false,false,,true',
    ].join('\n');
    expect(parseCSV(csv)).toEqual([{
      date: '2026-04-10',
      amount: 200,
      description: 'Car repair',
      constant: false,
      planned: false,
      plannedAmount: undefined,
      fromSavings: true,
    }]);
  });

  it('defaults fromSavings to false when column absent (legacy CSV)', () => {
    const csv = [
      'date,amount,description,constant,planned,plannedAmount',
      '2026-04-01,200.00,Car repair,false,false,',
    ].join('\n');
    expect(parseCSV(csv)).toEqual([{
      date: '2026-04-01',
      amount: 200,
      description: 'Car repair',
      constant: false,
      planned: false,
      plannedAmount: undefined,
      fromSavings: false,
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
      fromSavings: false,
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
      fromSavings: false,
    }];
    expect(parseCSV(serializeCSV(entries))).toEqual(entries);
  });

  it('serializes empty array to header only', () => {
    const csv = serializeCSV([]);
    expect(csv).toBe('date,amount,description,constant,planned,plannedAmount,fromSavings\n');
  });

  it('round-trips fromSavings: true', () => {
    const entries = [{
      date: '2026-04-10',
      amount: 200,
      description: 'Car repair',
      constant: false,
      planned: false,
      plannedAmount: undefined,
      fromSavings: true,
    }];
    expect(parseCSV(serializeCSV(entries))).toEqual(entries);
  });
});
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
yarn vitest run lib/csv.test.ts
```

Expected: all tests pass (no failures).

- [ ] **Step 5: Commit**

```bash
git add lib/types.ts lib/csv.ts lib/csv.test.ts
git commit -m "feat: add fromSavings field to Entry type and CSV layer"
```

---

## Task 2: Drive layer — savings_closing.txt helpers

**Files:**
- Modify: `lib/google-drive.ts`

- [ ] **Step 1: Add `readSavingsClosing` and `writeSavingsClosing` after `writeStartBalanceFile`**

In `lib/google-drive.ts`, add these two functions after the `writeStartBalanceFile` function (around line 125):

```typescript
async function readSavingsClosing(
  drive: ReturnType<typeof google.drive>,
  monthFolderId: string
): Promise<number> {
  const fileId = await findFile(drive, 'savings_closing.txt', monthFolderId);
  if (!fileId) return 0;
  const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'text' });
  const n = parseFloat(res.data as string);
  return isNaN(n) ? 0 : n;
}

async function writeSavingsClosing(
  drive: ReturnType<typeof google.drive>,
  monthFolderId: string,
  amount: number
): Promise<void> {
  const fileId = await findFile(drive, 'savings_closing.txt', monthFolderId);
  const body   = String(amount);
  if (fileId) {
    await drive.files.update({ fileId, media: { mimeType: 'text/plain', body } });
  } else {
    await drive.files.create({
      requestBody: { name: 'savings_closing.txt', parents: [monthFolderId] },
      media: { mimeType: 'text/plain', body },
      fields: 'id',
    });
  }
}
```

- [ ] **Step 2: Run type-check to verify no errors**

```bash
yarn tsc --noEmit
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add lib/google-drive.ts
git commit -m "feat: add readSavingsClosing and writeSavingsClosing drive helpers"
```

---

## Task 3: Drive layer — update `initAndGetMonth`

**Files:**
- Modify: `lib/google-drive.ts`

- [ ] **Step 1: Update `initAndGetMonth` wrapper signature**

Replace the export signature of `initAndGetMonth` (the public wrapper around `_initAndGetMonth`):

```typescript
export async function initAndGetMonth(
  accessToken: string,
  year: string,
  month: string
): Promise<{ wasNew: boolean; income: Entry[]; expenses: Entry[]; savings: Entry[]; startBalance: number; openingSavings: number }> {
  try {
    return await _initAndGetMonth(accessToken, year, month);
  } catch (err: unknown) {
    const e = err as { code?: number; message?: string };
    if (e?.code === 404 || e?.message?.includes('File not found')) {
      folderCache.clear();
      return _initAndGetMonth(accessToken, year, month);
    }
    throw err;
  }
}
```

- [ ] **Step 2: Replace `_initAndGetMonth` with updated version**

Replace the full `_initAndGetMonth` function:

```typescript
async function _initAndGetMonth(
  accessToken: string,
  year: string,
  month: string
): Promise<{ wasNew: boolean; income: Entry[]; expenses: Entry[]; savings: Entry[]; startBalance: number; openingSavings: number }> {
  const drive = driveClient(accessToken);
  const monthFolderId = await ensureFolderPath(drive, year, month);

  // Always resolve prev month folder — needed for openingSavings regardless of wasNew.
  const { year: py, month: pm } = prevYearMonth(year, month);
  const prevFolderId = await ensureFolderPath(drive, py, pm);

  // Check existence of all three CSV files in parallel.
  const fileIds: (string | null)[] = await Promise.all(
    CATEGORIES.map(cat => findFile(drive, `${cat}.csv`, monthFolderId))
  );

  const missingIdxs = fileIds.map((id, i) => id === null ? i : -1).filter(i => i !== -1);
  let wasNew = false;

  if (missingIdxs.length > 0) {
    wasNew = true;
    const firstDate = firstOfMonth(year, month);

    // Fetch prev-month file IDs and their contents in parallel.
    const prevFileIds = await Promise.all(
      missingIdxs.map(i => findFile(drive, `${CATEGORIES[i]}.csv`, prevFolderId))
    );
    const prevEntries = await Promise.all(
      prevFileIds.map(id => id ? readCSVFile(drive, id) : Promise.resolve([]))
    );

    // Create all missing files in parallel.
    const newIds = await Promise.all(
      missingIdxs.map((i, j) => {
        const seed = prevEntries[j]
          .filter(e => e.constant)
          .map(e => ({ ...e, date: firstDate }));
        return createCSVFile(drive, `${CATEGORIES[i]}.csv`, monthFolderId, seed);
      })
    );

    missingIdxs.forEach((i, j) => { fileIds[i] = newIds[j]; });
  }

  // Read all three CSV files, start balance, and prev month's closing savings in parallel.
  const [allEntries, startBalance, openingSavings] = await Promise.all([
    Promise.all(fileIds.map(id => id ? readCSVFile(drive, id) : Promise.resolve([]))),
    readStartBalance(drive, monthFolderId),
    readSavingsClosing(drive, prevFolderId),
  ]);

  // Seed savings_closing.txt for new months so the chain is never broken.
  if (wasNew) {
    await writeSavingsClosing(drive, monthFolderId, openingSavings);
  }

  return { wasNew, income: allEntries[0], expenses: allEntries[1], savings: allEntries[2], startBalance, openingSavings };
}
```

- [ ] **Step 3: Run type-check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/google-drive.ts
git commit -m "feat: initAndGetMonth now returns openingSavings from prev month"
```

---

## Task 4: Drive layer — `recomputeAndWriteSavingsClosing`

**Files:**
- Modify: `lib/google-drive.ts`

- [ ] **Step 1: Add exported helper at the bottom of `lib/google-drive.ts`**

Add after the `deleteEntry` function:

```typescript
export async function recomputeAndWriteSavingsClosing(
  accessToken: string,
  year: string,
  month: string
): Promise<void> {
  const drive = driveClient(accessToken);
  const monthFolderId = await ensureFolderPath(drive, year, month);
  const { year: py, month: pm } = prevYearMonth(year, month);
  const prevFolderId = await ensureFolderPath(drive, py, pm);

  const [allEntries, openingSavings] = await Promise.all([
    Promise.all(CATEGORIES.map(cat =>
      findFile(drive, `${cat}.csv`, monthFolderId)
        .then(id => id ? readCSVFile(drive, id) : Promise.resolve([]))
    )),
    readSavingsClosing(drive, prevFolderId),
  ]);

  const [income, expenses, savings] = allEntries;
  const fromSavingsDeductions = [...income, ...expenses]
    .filter(e => e.fromSavings)
    .reduce((sum, e) => sum + e.amount, 0);
  const savingsSum = savings.reduce((sum, e) => sum + e.amount, 0);
  const closing = openingSavings + savingsSum - fromSavingsDeductions;

  await writeSavingsClosing(drive, monthFolderId, closing);
}
```

- [ ] **Step 2: Run type-check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/google-drive.ts
git commit -m "feat: add recomputeAndWriteSavingsClosing drive helper"
```

---

## Task 5: API — entry route fire-and-forget recompute

**Files:**
- Modify: `app/api/drive/entry/route.ts`

- [ ] **Step 1: Replace `app/api/drive/entry/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { addEntry, updateEntry, patchEntry, deleteEntry, recomputeAndWriteSavingsClosing } from '@/lib/google-drive';
import type { Category, Entry } from '@/lib/types';

async function getSession() {
  const session = await auth();
  if (!session?.accessToken || session.error === 'RefreshTokenError') return null;
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
  recomputeAndWriteSavingsClosing(session.accessToken, year, month).catch(() => {});
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
  recomputeAndWriteSavingsClosing(session.accessToken, year, month).catch(() => {});
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    year: string; month: string; category: Category; index: number;
    constant?: boolean; planned?: boolean; plannedAmount?: number; amount?: number; fromSavings?: boolean;
  };
  const { year, month, category, index, ...patch } = body;

  await patchEntry(session.accessToken, year, month, category, index, patch);
  recomputeAndWriteSavingsClosing(session.accessToken, year, month).catch(() => {});
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    year: string; month: string; category: Category; index: number;
  };
  await deleteEntry(session.accessToken, body.year, body.month, body.category, body.index);
  recomputeAndWriteSavingsClosing(session.accessToken, body.year, body.month).catch(() => {});
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Run type-check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/drive/entry/route.ts
git commit -m "feat: recompute savings_closing.txt after every entry mutation"
```

---

## Task 6: i18n strings

**Files:**
- Modify: `app/lib/i18n.ts`

- [ ] **Step 1: Add 4 new keys to the `Translations` interface**

After `setStartBalance: string;` (line 56), insert:

```typescript
  fromSavings: string;
  fromSavingsSub: string;
  savingsBalance: string;
  prevMonthSavings: string;
```

- [ ] **Step 2: Add English translations**

After `setStartBalance: 'Set start balance',` in `translations.en`, insert:

```typescript
    fromSavings: 'From savings',
    fromSavingsSub: 'This transaction draws from the savings pool',
    savingsBalance: 'Savings balance',
    prevMonthSavings: 'prev. month',
```

- [ ] **Step 3: Add Polish translations**

After `setStartBalance: 'Ustaw saldo początkowe',` in `translations.pl`, insert:

```typescript
    fromSavings: 'Z oszczędności',
    fromSavingsSub: 'Ta transakcja pochodzi z puli oszczędności',
    savingsBalance: 'Saldo oszczędności',
    prevMonthSavings: 'poprz. miesiąc',
```

- [ ] **Step 4: Run type-check**

```bash
yarn tsc --noEmit
```

Expected: no errors (TypeScript will enforce all translation keys are present in both locales).

- [ ] **Step 5: Commit**

```bash
git add app/lib/i18n.ts
git commit -m "feat: add savings balance i18n strings (en + pl)"
```

---

## Task 7: SummaryCard — savings balance block

**Files:**
- Modify: `app/components/SummaryCard.tsx`

- [ ] **Step 1: Replace `app/components/SummaryCard.tsx`**

```typescript
'use client';
import type { Entry } from '@/lib/types';
import { useT } from './LanguageContext';

const sumActual  = (arr: Entry[]) => arr.filter(e => !e.planned).reduce((a, b) => a + b.amount, 0);
const sumPlanned = (arr: Entry[]) => arr.filter(e => e.planned).reduce((a, b) => a + b.amount, 0);

interface Props {
  income:             Entry[];
  expenses:           Entry[];
  savings:            Entry[];
  isFuture:           boolean;
  startBalance:       number;
  openingSavings:     number;
  onEditStartBalance: () => void;
}

export function SummaryCard({ income, expenses, savings, isFuture, startBalance, openingSavings, onEditStartBalance }: Props) {
  const { t, fmt, fmtShort } = useT();

  const aI = sumActual(income),  pI = sumPlanned(income);
  const aE = sumActual(expenses), pE = sumPlanned(expenses);
  const aS = sumActual(savings),  pS = sumPlanned(savings);

  const tI = aI + pI, tE = aE + pE, tS = aS + pS;
  const balance = startBalance + tI - tE - tS;
  const hasData = tI > 0 || tE > 0 || tS > 0;
  const total = tI || 1;

  const expPct = Math.min(100, (tE / total) * 100);
  const savPct = Math.min(100, (tS / total) * 100);
  const incPct = Math.max(0, 100 - expPct - savPct);

  const fromSavIncome   = income.filter(e => e.fromSavings).reduce((s, e) => s + e.amount, 0);
  const fromSavExpenses = expenses.filter(e => e.fromSavings).reduce((s, e) => s + e.amount, 0);
  const closingSavings  = openingSavings + tS - fromSavIncome - fromSavExpenses;

  const legend = [
    { label: t.income,   actual: aI, planned: pI, color: 'var(--income-mid)'  },
    { label: t.expenses, actual: aE, planned: pE, color: 'var(--expense-mid)' },
    { label: t.savings,  actual: aS, planned: pS, color: 'var(--savings-mid)' },
  ];

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.5, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            {isFuture ? t.projectedBalance : t.balanceThisMonth}
            {isFuture && (
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', background: 'oklch(100% 0 0 / 0.1)', padding: '2px 6px', borderRadius: 4, opacity: 1 }}>FORECAST</span>
            )}
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px' }}>
            {balance >= 0
              ? <span>{fmt(balance)}{isFuture && <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.5, marginLeft: 6 }}>{t.projected}</span>}</span>
              : <span style={{ color: 'oklch(70% 0.18 22)' }}>{fmt(balance)}</span>
            }
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.5, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            {t.savingsBalance}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--savings-mid)' }}>
            {fmt(closingSavings)}
          </div>
          <div style={{ fontSize: 10, opacity: 0.45, fontWeight: 500, marginTop: 2 }}>
            {t.prevMonthSavings} {fmt(openingSavings)}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ height: 6, borderRadius: 3, background: 'oklch(100% 0 0 / 0.12)', overflow: 'hidden', display: 'flex' }}>
          {hasData && <>
            <div style={{ width: `${incPct}%`, background: 'var(--income-mid)', transition: 'width 0.5s' }} />
            <div style={{ width: `${expPct}%`, background: 'var(--expense-mid)', transition: 'width 0.5s' }} />
            <div style={{ width: `${savPct}%`, background: 'var(--savings-mid)', transition: 'width 0.5s' }} />
          </>}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {legend.map(({ label, actual, planned, color }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: 10.5, opacity: 0.6, fontWeight: 500 }}>{label}</span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{fmtShort(actual + planned)}</span>
            {isFuture && planned > 0 && (
              <span style={{ fontSize: 10, opacity: 0.45, fontWeight: 500 }}>{fmtShort(actual)} {t.actual}</span>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onEditStartBalance}
        style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'oklch(100% 0 0 / 0.07)', border: 'none', borderRadius: 8, padding: '7px 10px', cursor: 'pointer' }}
      >
        <span style={{ fontSize: 11, color: 'oklch(100% 0 0 / 0.55)', fontWeight: 500 }}>{t.startBalance}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'white', fontWeight: 700 }}>{fmt(startBalance)}</span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="oklch(100% 0 0 / 0.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </div>
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Run type-check**

```bash
yarn tsc --noEmit
```

Expected: TypeScript will now require `openingSavings` to be passed at the call site — that's intentional and will be fixed in Task 11.

- [ ] **Step 3: Commit**

```bash
git add app/components/SummaryCard.tsx
git commit -m "feat: add savings balance block to SummaryCard"
```

---

## Task 8: SummaryBar — savings balance block

**Files:**
- Modify: `app/components/SummaryBar.tsx`

- [ ] **Step 1: Replace `app/components/SummaryBar.tsx`**

```typescript
'use client';
import type { Entry } from '@/lib/types';
import { useT } from './LanguageContext';

const sumActual  = (arr: Entry[]) => arr.filter(e => !e.planned).reduce((a, b) => a + b.amount, 0);
const sumPlanned = (arr: Entry[]) => arr.filter(e => e.planned).reduce((a, b) => a + b.amount, 0);

interface Props {
  income:             Entry[];
  expenses:           Entry[];
  savings:            Entry[];
  isFutureMonth:      boolean;
  startBalance:       number;
  openingSavings:     number;
  onEditStartBalance: () => void;
}

export function SummaryBar({ income, expenses, savings, isFutureMonth, startBalance, openingSavings, onEditStartBalance }: Props) {
  const { t, fmt, fmtShort } = useT();

  const aI = sumActual(income),  pI = sumPlanned(income);
  const aE = sumActual(expenses), pE = sumPlanned(expenses);
  const aS = sumActual(savings),  pS = sumPlanned(savings);
  const tI = aI + pI, tE = aE + pE, tS = aS + pS;
  const balance = startBalance + tI - tE - tS;
  const hasData = tI > 0 || tE > 0 || tS > 0;
  const total = tI || 1;

  const expPct = Math.min(100, (tE / total) * 100);
  const savPct = Math.min(100, (tS / total) * 100);
  const incPct = Math.max(0, 100 - expPct - savPct);

  const fromSavIncome   = income.filter(e => e.fromSavings).reduce((s, e) => s + e.amount, 0);
  const fromSavExpenses = expenses.filter(e => e.fromSavings).reduce((s, e) => s + e.amount, 0);
  const closingSavings  = openingSavings + tS - fromSavIncome - fromSavExpenses;

  const legend = [
    { label: t.income,   actual: aI, planned: pI, dot: 'var(--income-mid)'  },
    { label: t.expenses, actual: aE, planned: pE, dot: 'var(--expense-mid)' },
    { label: t.savings,  actual: aS, planned: pS, dot: 'var(--savings-mid)' },
  ];

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
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: 'oklch(100% 0 0 / 0.45)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
          {isFutureMonth ? t.projectedBalance : t.balance}
          {isFutureMonth && (
            <span style={{ fontSize: 8.5, fontWeight: 700, background: 'oklch(100% 0 0 / 0.1)', padding: '1px 5px', borderRadius: 3, letterSpacing: '0.06em' }}>FORECAST</span>
          )}
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.8px', color: balance < 0 ? 'oklch(70% 0.18 22)' : 'white' }}>
          {fmt(balance)}
        </div>
        <button
          onClick={onEditStartBalance}
          style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 5, background: 'oklch(100% 0 0 / 0.08)', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}
        >
          <span style={{ fontSize: 10.5, color: 'oklch(100% 0 0 / 0.5)', fontWeight: 500 }}>{t.startBalance}:</span>
          <span style={{ fontSize: 11, color: 'white', fontWeight: 700 }}>{fmt(startBalance)}</span>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="oklch(100% 0 0 / 0.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ height: 6, borderRadius: 3, background: 'oklch(100% 0 0 / 0.12)', overflow: 'hidden', display: 'flex', marginBottom: 8 }}>
          {hasData && <>
            <div style={{ width: `${incPct}%`, background: 'var(--income-mid)', transition: 'width 0.5s' }} />
            <div style={{ width: `${expPct}%`, background: 'var(--expense-mid)', transition: 'width 0.5s' }} />
            <div style={{ width: `${savPct}%`, background: 'var(--savings-mid)', transition: 'width 0.5s' }} />
          </>}
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {legend.map(({ label, actual, planned, dot }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: dot, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: 'oklch(100% 0 0 / 0.5)', fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 12, color: 'white', fontWeight: 700 }}>{fmtShort(actual + planned)}</span>
              {isFutureMonth && planned > 0 && (
                <span style={{ fontSize: 10, color: 'oklch(100% 0 0 / 0.35)', fontWeight: 500 }}>({fmtShort(actual)} {t.actual})</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: 'oklch(100% 0 0 / 0.45)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
          {t.savingsBalance}
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--savings-mid)' }}>
          {fmt(closingSavings)}
        </div>
        <div style={{ fontSize: 10, color: 'oklch(100% 0 0 / 0.4)', fontWeight: 500, marginTop: 2 }}>
          {t.prevMonthSavings} {fmt(openingSavings)}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run type-check**

```bash
yarn tsc --noEmit
```

Expected: same pending error about missing `openingSavings` prop at call sites — resolved in Task 11.

- [ ] **Step 3: Commit**

```bash
git add app/components/SummaryBar.tsx
git commit -m "feat: add savings balance block to SummaryBar"
```

---

## Task 9: Entry forms — `fromSavings` toggle

**Files:**
- Modify: `app/components/EntryForm.tsx`
- Modify: `app/components/EntrySheet.tsx`

- [ ] **Step 1: Update `FormState` in `EntryForm.tsx` and add toggle**

In `app/components/EntryForm.tsx`:

1. Add `fromSavings: boolean` to the `FormState` interface:

```typescript
interface FormState {
  date: string;
  amount: string;
  description: string;
  constant: boolean;
  planned: boolean;
  fromSavings: boolean;
}
```

2. Update the default state in `useState` (the `initial ??` fallback):

```typescript
  const [form, setForm] = useState<FormState>(
    initial ?? { date: today, amount: '', description: '', constant: false, planned: isFutureMonth, fromSavings: false }
  );
```

3. Update the `useEffect` reset:

```typescript
  useEffect(() => {
    setForm(initial ?? { date: today, amount: '', description: '', constant: false, planned: isFutureMonth, fromSavings: false });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
```

4. Add the `fromSavings` toggle after the `planned` toggle and before the `constant` toggle (i.e., between lines 108 and 109 in the original):

```tsx
      {cat.key !== 'savings' && (
        <Toggle value={form.fromSavings} onChange={() => setForm((f) => ({ ...f, fromSavings: !f.fromSavings }))} color="var(--savings)" label={t.fromSavings} sub={t.fromSavingsSub} />
      )}
```

- [ ] **Step 2: Update `FormState` in `EntrySheet.tsx` and add toggle**

In `app/components/EntrySheet.tsx`:

1. Add `fromSavings: boolean` to the `FormState` interface:

```typescript
interface FormState {
  date: string;
  amount: string;
  description: string;
  constant: boolean;
  planned: boolean;
  fromSavings: boolean;
}
```

2. Update the `useState` default:

```typescript
  const [form, setForm] = useState<FormState>({ date: defaultDate, amount: '', description: '', constant: false, planned: false, fromSavings: false });
```

3. Update the `useEffect` reset for the non-edit case:

```typescript
        setForm({ date: defaultDate, amount: '', description: '', constant: false, planned: isFuture, fromSavings: false });
```

4. Update the edit case inside `useEffect` to default `fromSavings`:

```typescript
        setForm({ ...editEntry, amount: String(editEntry.amount), fromSavings: editEntry.fromSavings ?? false });
```

5. Add the `fromSavings` toggle after the `planned` Toggle and before the `constant` Toggle (between the two existing `<Toggle>` elements):

```tsx
          {category !== 'savings' && (
            <Toggle
              value={form.fromSavings}
              onChange={() => setForm((f) => ({ ...f, fromSavings: !f.fromSavings }))}
              color="var(--savings)"
              label={t.fromSavings}
              sub={t.fromSavingsSub}
            />
          )}
```

- [ ] **Step 3: Run type-check**

```bash
yarn tsc --noEmit
```

Expected: no errors (the `onSave` calls already spread `form` which now includes `fromSavings`).

- [ ] **Step 4: Commit**

```bash
git add app/components/EntryForm.tsx app/components/EntrySheet.tsx
git commit -m "feat: add fromSavings toggle to entry forms (income and expenses only)"
```

---

## Task 10: Entry rows — `fromSavings` indicator

**Files:**
- Modify: `app/components/EntryRow.tsx`
- Modify: `app/components/DesktopEntryRow.tsx`

- [ ] **Step 1: Add savings badge in `EntryRow.tsx`**

In `app/components/EntryRow.tsx`, inside the sub-line `<div>` (the one showing date, recurring, planned tags — around line 84), add the `fromSavings` badge after the existing `{isPlanned && ...}` span:

```tsx
            {entry.fromSavings && (
              <span style={{ color: 'var(--savings)', fontWeight: 600, fontSize: 10, background: 'oklch(93% 0.06 200)', padding: '1px 5px', borderRadius: 4 }}>savings</span>
            )}
```

- [ ] **Step 2: Add savings badge in `DesktopEntryRow.tsx`**

In `app/components/DesktopEntryRow.tsx`, inside the sub-line `<div>` (around line 53), add the `fromSavings` badge after the `{isPlanned && ...}` span:

```tsx
          {entry.fromSavings && <span style={{ color: 'var(--savings)', fontWeight: 600, fontSize: 10, background: 'oklch(93% 0.06 200)', padding: '1px 4px', borderRadius: 3 }}>savings</span>}
```

- [ ] **Step 3: Run type-check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/components/EntryRow.tsx app/components/DesktopEntryRow.tsx
git commit -m "feat: show savings pool badge on fromSavings entries"
```

---

## Task 11: Wire up page and DashboardClient

**Files:**
- Modify: `app/dashboard/[year]/[month]/page.tsx`
- Modify: `app/dashboard/[year]/[month]/DashboardClient.tsx`

- [ ] **Step 1: Update `page.tsx` to pass `openingSavings`**

Replace the destructuring and `initialData` construction:

```typescript
  const { wasNew, income, expenses, savings, startBalance, openingSavings } = await initAndGetMonth(
    session.accessToken, year, month
  );

  const markPlanned = (entries: typeof income) =>
    isFutureMth ? entries.map(e => ({ ...e, planned: e.planned ?? true })) : entries;

  const initialData: MonthData = {
    income:        markPlanned(income),
    expenses:      markPlanned(expenses),
    savings:       markPlanned(savings),
    startBalance,
    openingSavings,
  };
```

- [ ] **Step 2: Pass `openingSavings` to SummaryCard in `DashboardClient.tsx`**

Find the mobile `<SummaryCard ...>` call (around line 321) and add the prop:

```tsx
      <SummaryCard income={data.income ?? []} expenses={data.expenses ?? []} savings={data.savings ?? []} isFuture={isFuture} startBalance={startBal} openingSavings={data.openingSavings} onEditStartBalance={() => setEditingBal(true)} />
```

- [ ] **Step 3: Pass `openingSavings` to SummaryBar in `DashboardClient.tsx`**

Find the desktop `<SummaryBar ...>` call (around line 244) and add the prop:

```tsx
        <SummaryBar income={data.income ?? []} expenses={data.expenses ?? []} savings={data.savings ?? []} isFutureMonth={isFuture} startBalance={startBal} openingSavings={data.openingSavings} onEditStartBalance={() => setEditingBal(true)} />
```

- [ ] **Step 4: Update desktop edit modal to include `fromSavings`**

Find the desktop edit modal `initial` prop (around line 280) and default `fromSavings`:

```tsx
                initial={{ ...entry, amount: String(entry.amount), fromSavings: entry.fromSavings ?? false }}
```

- [ ] **Step 5: Run type-check — should now be clean**

```bash
yarn tsc --noEmit
```

Expected: zero TypeScript errors.

- [ ] **Step 6: Run all tests**

```bash
yarn vitest run
```

Expected: all tests pass.

- [ ] **Step 7: Start dev server and verify manually**

```bash
yarn dev
```

Open `http://localhost:3000`. Check:
- Mobile SummaryCard shows two balance blocks (balance left, savings balance right).
- Desktop SummaryBar shows savings balance on the right.
- Adding an expense shows a "From savings" toggle (not visible for savings entries).
- Toggling "From savings" on an entry shows the savings badge in the entry row.
- Savings balance updates in real-time as you add/edit entries.
- Navigate to a new month — savings balance starts from the previous month's closing value.

- [ ] **Step 8: Commit**

```bash
git add app/dashboard/[year]/[month]/page.tsx app/dashboard/[year]/[month]/DashboardClient.tsx
git commit -m "feat: wire openingSavings through page and DashboardClient"
```
