# Design: Language Toggle (EN / PL) + Remove Next.js Dev Indicator

**Date:** 2026-04-29  
**Status:** Approved

## Overview

Add English and Polish language support to budgetMe via a client-side React Context approach (no external i18n library). Currency formatting switches alongside the language: USD for English, PLN for Polish. A language toggle pill (`EN | PL`) appears in both the mobile and desktop navigation. The Next.js development indicator (bottom-left icon) is also removed.

## Architecture

### `app/lib/i18n.ts`

Single source of truth for all UI strings and currency formatting.

```ts
export type Lang = 'en' | 'pl';

export const translations = {
  en: { ... },
  pl: { ... },
} satisfies Record<Lang, Translations>;

export function fmt(n: number, lang: Lang): string
export function fmtShort(n: number, lang: Lang): string
```

- `fmt` uses `Intl.NumberFormat('en-US', { currency: 'USD' })` for EN, `Intl.NumberFormat('pl-PL', { currency: 'PLN' })` for PL.
- `fmtShort` uses `$` prefix and `k` suffix for EN; `zł` suffix for PL (e.g. `1,2 tys. zł`).

### `app/components/LanguageContext.tsx`

```tsx
export const LanguageContext = createContext<LanguageContextValue>(...);
export function LanguageProvider({ children }) // reads/writes localStorage('budgetMe-lang')
export function useT() // returns { t, lang, setLang, fmt, fmtShort }
```

- Initial value: reads `localStorage.getItem('budgetMe-lang')`, falls back to `'en'`.
- `setLang` writes to localStorage and updates state.
- `useT()` is the only hook components use — no direct context imports in feature code.

### `app/layout.tsx`

Wrap `<body>` with `<LanguageProvider>`. Since layout is a Server Component, `LanguageProvider` must be a Client Component (already the case with the `'use client'` directive).

## Language Toggle UI

A small two-segment pill: `EN | PL`. Active segment has a filled background.

- **Desktop:** Right side of the top nav, immediately left of the "Sign out" button.
- **Mobile:** Inside `Header.tsx`, between the "budgetMe" logo and the "Sign out" button.

No flag icons — text only for simplicity.

## Strings to Translate

### Categories
| EN | PL |
|---|---|
| Income | Przychody |
| Expenses | Wydatki |
| Savings | Oszczędności |

### Dashboard / Nav
| EN | PL |
|---|---|
| Sign out | Wyloguj |
| Today | Dzisiaj |
| Balance | Saldo |
| Balance this month | Saldo w tym miesiącu |
| Projected balance | Przewidywane saldo |
| Forecast | Prognoza |
| projected | prognozowane |
| Thin bar = verified so far | Cienki pasek = zweryfikowane |

### Month names
Full Polish month names array replacing the English `MONTHS` array in `DashboardClient.tsx` (driven by lang).

### Entry Form
| EN | PL |
|---|---|
| Description | Opis |
| e.g. Monthly Salary | np. Miesięczna pensja |
| Amount ($) | Kwota (zł) |
| Date | Data |
| Planned entry | Wpis planowany |
| Expected amount — verify when it happens | Oczekiwana kwota — zweryfikuj gdy nastąpi |
| Recurring entry | Wpis cykliczny |
| Carry over to next month | Przenieś do następnego miesiąca |
| Cancel | Anuluj |
| Add as planned | Dodaj jako planowany |
| Add entry | Dodaj wpis |
| Save changes | Zapisz zmiany |
| Required | Wymagane |
| Enter a valid amount | Wprowadź prawidłową kwotę |

### Entry Row / Category Column
| EN | PL |
|---|---|
| Add | Dodaj |
| Plan | Planuj |
| No {category} entries yet | Brak wpisów {kategoria} |
| Add planned amounts to forecast this month | Dodaj planowane kwoty, aby prognozować ten miesiąc |
| Total {category} | Łącznie {kategoria} |
| actual | rzeczywiste |

### Banners
| EN | PL |
|---|---|
| Pre-populated from last month | Uzupełniono z poprzedniego miesiąca |
| Recurring entries were carried over. You can remove or toggle them off. | Wpisy cykliczne zostały przeniesione. Możesz je usunąć lub wyłączyć. |
| Forecast mode | Tryb prognozy |
| verified | zweryfikowane |
| planned | planowane |

### Verify Flow
| EN | PL |
|---|---|
| Verify entry | Weryfikuj wpis |
| Planned amount | Planowana kwota |
| Actual amount ($) | Rzeczywista kwota (zł) |
| Keep planned | Zachowaj planowany |
| Verify | Zweryfikuj |

### Sign-in Page
| EN | PL |
|---|---|
| Your finances, stored only on your Google Drive. | Twoje finanse, przechowywane wyłącznie na Twoim Dysku Google. |
| Continue with Google | Kontynuuj przez Google |
| Signing in… | Logowanie… |
| budgetMe only accesses files it creates in your Google Drive. Nothing else. | budgetMe uzyskuje dostęp tylko do plików, które sam tworzy na Twoim Dysku Google. Nic więcej. |

### Modal titles (dynamic)
| EN | PL |
|---|---|
| Add {Label} entry | Dodaj wpis: {Etykieta} |
| Edit {Label} entry | Edytuj wpis: {Etykieta} |

## Components Affected

Every component that renders a string literal needs to call `useT()`:

- `app/components/Header.tsx` — sign out, language toggle
- `app/components/CategoryTabs.tsx` — category labels
- `app/components/SummaryCard.tsx` — balance labels, fmt/fmtShort
- `app/components/SummaryBar.tsx` — balance, forecast labels, fmt/fmtShort
- `app/components/EntryForm.tsx` — all form labels, toggle labels, buttons
- `app/components/EntryRow.tsx` — actions
- `app/components/EntrySheet.tsx` — sheet title
- `app/components/VerifySheet.tsx` — verify labels
- `app/components/ConstantBanner.tsx` — banner text
- `app/components/PlannedBanner.tsx` — forecast mode label
- `app/components/CategoryColumn.tsx` — add button, empty state
- `app/components/Modal.tsx` — no strings (title passed as prop)
- `app/dashboard/[year]/[month]/DashboardClient.tsx` — month names, modal titles, CAT_DEFS labels, empty states, fmt/fmtShort, Today button, Verify modal

## Removing the Next.js Dev Indicator

Add `devIndicators: false` to `next.config.ts`:

```ts
const nextConfig: NextConfig = {
  output: 'standalone',
  distDir: 'build',
  devIndicators: false,
};
```

This removes the small Next.js icon from the bottom-left corner in development mode.

## Data Flow

```
localStorage('budgetMe-lang')
    ↓
LanguageProvider (app/layout.tsx)
    ↓
useT() hook → { t, lang, setLang, fmt, fmtShort }
    ↓
All client components
```

Language state lives entirely on the client. No server-side locale detection, no URL changes, no SSR impact.

## Out of Scope

- Date locale formatting (dates remain `YYYY-MM-DD` input format)
- Right-to-left support
- Any language beyond EN and PL
- Automatic browser locale detection
