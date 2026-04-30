# Savings Balance Chain + "From Savings" Expense Toggle

**Date:** 2026-04-30
**Status:** Approved

## Overview

Two related features:

1. **Savings pool balance** — a running savings balance that carries forward across months, computed dynamically from the previous month's closing savings balance. Displayed in the SummaryCard alongside the existing overall balance.
2. **"From savings" toggle** — income and expense entries can be tagged as drawing from the savings pool, which deducts them from the savings balance rather than (or in addition to) the overall balance tracking.

The existing `startBalance` (manual, stored in `balance.txt`) and the overall balance formula (`startBalance + income − expenses − savings`) are **unchanged**.

---

## Data Model

### `Entry` type — new field

```ts
fromSavings?: boolean  // income and expenses only; undefined/false = normal
```

CSV header becomes:
```
date,amount,description,constant,planned,plannedAmount,fromSavings
```

Old CSV files without the column parse as `false` via the existing `get(col, fallback)` pattern in `csv.ts` — fully backward-compatible, no migration needed.

### `MonthData` type — new field

```ts
openingSavings: number  // previous month's closing savings balance (0 for first month)
```

### New file: `savings_closing.txt`

Lives in each month folder alongside `balance.txt`. Stores the closing savings pool balance for that month as a plain number string.

**Closing savings formula:**
```
closingSavings = openingSavings
              + sum(savings entries)
              − sum(income entries where fromSavings=true)
              − sum(expense entries where fromSavings=true)
```

---

## Drive Layer (`lib/google-drive.ts`)

### New helpers

**`readSavingsClosing(drive, monthFolderId): Promise<number>`**
Reads `savings_closing.txt`; returns `0` if absent. Mirrors `readStartBalance`.

**`writeSavingsClosing(drive, monthFolderId, amount): Promise<void>`**
Upserts `savings_closing.txt`. Mirrors `writeStartBalanceFile`.

### `initAndGetMonth` changes

After resolving the month folder, reads the previous month's `savings_closing.txt` in parallel alongside the existing `readStartBalance` call. Returns `openingSavings: number` in the result object.

When `wasNew = true`, `initAndGetMonth` seeds `savings_closing.txt` with `openingSavings` immediately (no entries yet, so closing = opening). This guarantees the file always exists after month initialization, so subsequent months can always read a valid previous closing value.

### New exported helper

**`recomputeAndWriteSavingsClosing(accessToken, year, month): Promise<void>`**

Called by all entry mutation routes after a successful operation. Steps:
1. Read current month's three entry files.
2. Read previous month's `savings_closing.txt` for `openingSavings`.
3. Compute `closingSavings` using the formula above.
4. Write result to current month's `savings_closing.txt`.

---

## API Routes

### `/api/drive/entry` (POST / PUT / PATCH / DELETE)

After each successful entry operation, call `recomputeAndWriteSavingsClosing` **fire-and-forget** (response does not await it). Client already optimistically updates UI, so the slight async delay is invisible.

### `/api/drive/entries` (GET)

No change — `fromSavings` is part of the CSV row and comes through automatically.

### `/api/drive/balance` (POST)

No change — this route manages `startBalance` only.

---

## UI Changes

### `SummaryCard` / `SummaryBar`

The existing large balance number and `startBalance` edit button remain on the left, unchanged.

A new block appears to the right showing:
```
SAVINGS BALANCE
[closingSavings amount]
prev. month  [openingSavings amount]
```

Styled in savings-blue (`--savings-mid`, `--savings`). `openingSavings` is displayed as a small sub-label beneath the closing amount.

Props added: `openingSavings: number`.

### `EntryForm`

A new `Toggle` row — **"From savings" / "Paid from savings pool"** — is rendered when `cat.key === 'income'` or `cat.key === 'expenses'`. Hidden entirely for `savings` category. Stored as `fromSavings` in `FormState`, serialized into `Entry` on save.

### `EntryRow` / `DesktopEntryRow`

Entries with `fromSavings: true` display a small savings-blue indicator (colored dot or coin icon) so the user can identify savings-pool transactions at a glance.

---

## Error Handling

| Scenario | Behavior |
|---|---|
| `savings_closing.txt` missing (first month, or deleted externally) | `openingSavings` defaults to `0` |
| `recomputeAndWriteSavingsClosing` fails after mutation | Savings balance may be stale until next mutation or reload — self-correcting |
| Old CSV files without `fromSavings` column | Parses as `false` — backward-compatible |
| `savings_closing.txt` contains non-numeric content | `parseFloat` returns `NaN`, falls back to `0` |

---

## File Layout (per month folder on Drive)

```
budgetMe/{year}/{month}/
  income.csv
  expenses.csv
  savings.csv
  balance.txt           ← startBalance (existing, unchanged)
  savings_closing.txt   ← NEW: closing savings pool balance
```
