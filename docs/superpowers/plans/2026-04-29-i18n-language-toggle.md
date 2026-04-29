# i18n Language Toggle (EN / PL) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Polish/English language switching with currency change (USD ↔ PLN) and remove the Next.js dev indicator.

**Architecture:** A `LanguageContext` React Context wraps the app at layout level, persisting lang choice to localStorage. A `useT()` hook returns `{ t, lang, setLang, fmt, fmtShort }`. All translatable strings live in `app/lib/i18n.ts`. A language toggle pill `EN | PL` appears in the mobile Header and desktop nav.

**Tech Stack:** React Context API, localStorage, Intl.NumberFormat, Next.js App Router (TypeScript)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `app/lib/i18n.ts` | All translations + fmt/fmtShort functions |
| Create | `app/components/LanguageContext.tsx` | Context, Provider, useT hook |
| Modify | `app/layout.tsx` | Wrap body with LanguageProvider |
| Modify | `app/components/Header.tsx` | Language toggle + sign out label |
| Modify | `app/components/MonthPicker.tsx` | Month names, Today, Forecast |
| Modify | `app/components/CategoryTabs.tsx` | Category labels |
| Modify | `app/components/SummaryCard.tsx` | Balance labels, fmt/fmtShort |
| Modify | `app/components/SummaryBar.tsx` | Balance labels, fmt/fmtShort |
| Modify | `app/components/EntryForm.tsx` | All form labels, toggle labels, buttons |
| Modify | `app/components/EntryRow.tsx` | fmt, "recurring", "planned", "Verify", "as planned" |
| Modify | `app/components/EntrySheet.tsx` | Sheet title, form labels, toggle labels, buttons |
| Modify | `app/components/VerifySheet.tsx` | Sheet title, labels, buttons, fmt |
| Modify | `app/components/ConstantBanner.tsx` | Banner text |
| Modify | `app/components/PlannedBanner.tsx` | "Forecast mode", "verified", "planned" |
| Modify | `app/components/CategoryColumn.tsx` | Add/Plan button, empty state, Total, fmt |
| Modify | `app/dashboard/[year]/[month]/DashboardClient.tsx` | Month names, CAT_DEFS labels, modal titles, empty state, fmt/fmtShort, Today button, Verify modal strings |
| Modify | `app/sign-in/page.tsx` | All sign-in page strings |
| Modify | `next.config.ts` | devIndicators: false |

---

## Task 1: Create `app/lib/i18n.ts`

**Files:**
- Create: `app/lib/i18n.ts`

- [ ] **Step 1: Create the file**

```typescript
// app/lib/i18n.ts

export type Lang = 'en' | 'pl';

export interface Translations {
  signOut: string;
  today: string;
  forecast: string;
  forecastMode: string;
  projectedBalance: string;
  balanceThisMonth: string;
  balance: string;
  projected: string;
  thinBarNote: string;
  verified: string;
  planned: string;
  recurring: string;
  asPlanned: string;
  verify: string;
  keepPlanned: string;
  plannedAmount: string;
  actualAmount: string;
  add: string;
  plan: string;
  total: string;
  actual: string;
  cancel: string;
  saveChanges: string;
  addEntry: string;
  addAsPlanned: string;
  editEntry: string;
  description: string;
  descriptionPlaceholder: string;
  amount: string;
  date: string;
  plannedEntry: string;
  plannedEntrySub: string;
  recurringEntry: string;
  recurringEntrySub: string;
  required: string;
  invalidAmount: string;
  income: string;
  expenses: string;
  savings: string;
  noEntriesYet: (cat: string) => string;
  planExpected: (cat: string) => string;
  addCategoryEntry: (label: string) => string;
  editCategoryEntry: (label: string) => string;
  constantBannerTitle: string;
  constantBannerBody: string;
  verifyEntry: string;
  continueWithGoogle: string;
  signingIn: string;
  tagline: string;
  driveDisclaimer: string;
  plannedBannerVerified: (n: number) => string;
  plannedBannerPlanned: (n: number) => string;
  months: string[];
}

export const translations: Record<Lang, Translations> = {
  en: {
    signOut: 'Sign out',
    today: 'Today',
    forecast: 'Forecast',
    forecastMode: 'Forecast mode',
    projectedBalance: 'Projected balance',
    balanceThisMonth: 'Balance this month',
    balance: 'Balance',
    projected: 'projected',
    thinBarNote: 'Thin bar = verified so far',
    verified: 'verified',
    planned: 'planned',
    recurring: 'recurring',
    asPlanned: 'as planned',
    verify: 'Verify',
    keepPlanned: 'Keep planned',
    plannedAmount: 'Planned amount',
    actualAmount: 'Actual amount ($)',
    add: 'Add',
    plan: 'Plan',
    total: 'Total',
    actual: 'actual',
    cancel: 'Cancel',
    saveChanges: 'Save changes',
    addEntry: 'Add entry',
    addAsPlanned: 'Add as planned',
    editEntry: 'Edit entry',
    description: 'Description',
    descriptionPlaceholder: 'e.g. Monthly Salary',
    amount: 'Amount ($)',
    date: 'Date',
    plannedEntry: 'Planned entry',
    plannedEntrySub: 'Expected amount — verify when it happens',
    recurringEntry: 'Recurring entry',
    recurringEntrySub: 'Automatically carry over to next month',
    required: 'Required',
    invalidAmount: 'Enter a valid amount',
    income: 'Income',
    expenses: 'Expenses',
    savings: 'Savings',
    noEntriesYet: (cat) => `No ${cat} entries yet`,
    planExpected: (cat) => `Plan expected ${cat}`,
    addCategoryEntry: (label) => `Add ${label} entry`,
    editCategoryEntry: (label) => `Edit ${label} entry`,
    constantBannerTitle: 'Pre-populated from last month',
    constantBannerBody: 'Recurring entries were carried over. You can remove or toggle them off.',
    verifyEntry: 'Verify entry',
    continueWithGoogle: 'Continue with Google',
    signingIn: 'Signing in\u2026',
    tagline: 'Your finances, stored\nonly on your Google Drive.',
    driveDisclaimer: 'budgetMe only accesses files it creates in\nyour Google Drive. Nothing else.',
    plannedBannerVerified: (n) => `${n} verified`,
    plannedBannerPlanned: (n) => `${n} planned`,
    months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  },
  pl: {
    signOut: 'Wyloguj',
    today: 'Dzisiaj',
    forecast: 'Prognoza',
    forecastMode: 'Tryb prognozy',
    projectedBalance: 'Przewidywane saldo',
    balanceThisMonth: 'Saldo w tym miesiącu',
    balance: 'Saldo',
    projected: 'prognozowane',
    thinBarNote: 'Cienki pasek = zweryfikowane',
    verified: 'zweryfikowane',
    planned: 'planowane',
    recurring: 'cykliczny',
    asPlanned: 'zgodnie z planem',
    verify: 'Zweryfikuj',
    keepPlanned: 'Zachowaj planowany',
    plannedAmount: 'Kwota planowana',
    actualAmount: 'Kwota rzeczywista (zł)',
    add: 'Dodaj',
    plan: 'Planuj',
    total: 'Łącznie',
    actual: 'rzeczywiste',
    cancel: 'Anuluj',
    saveChanges: 'Zapisz zmiany',
    addEntry: 'Dodaj wpis',
    addAsPlanned: 'Dodaj jako planowany',
    editEntry: 'Edytuj wpis',
    description: 'Opis',
    descriptionPlaceholder: 'np. Miesięczna pensja',
    amount: 'Kwota (zł)',
    date: 'Data',
    plannedEntry: 'Wpis planowany',
    plannedEntrySub: 'Oczekiwana kwota — zweryfikuj gdy nastąpi',
    recurringEntry: 'Wpis cykliczny',
    recurringEntrySub: 'Automatycznie przenoś do następnego miesiąca',
    required: 'Wymagane',
    invalidAmount: 'Wprowadź prawidłową kwotę',
    income: 'Przychody',
    expenses: 'Wydatki',
    savings: 'Oszczędności',
    noEntriesYet: (cat) => `Brak wpisów: ${cat}`,
    planExpected: (cat) => `Zaplanuj oczekiwane: ${cat}`,
    addCategoryEntry: (label) => `Dodaj wpis: ${label}`,
    editCategoryEntry: (label) => `Edytuj wpis: ${label}`,
    constantBannerTitle: 'Uzupełniono z poprzedniego miesiąca',
    constantBannerBody: 'Wpisy cykliczne zostały przeniesione. Możesz je usunąć lub wyłączyć.',
    verifyEntry: 'Weryfikuj wpis',
    continueWithGoogle: 'Kontynuuj przez Google',
    signingIn: 'Logowanie\u2026',
    tagline: 'Twoje finanse, przechowywane\nwyłącznie na Twoim Dysku Google.',
    driveDisclaimer: 'budgetMe uzyskuje dostęp tylko do plików,\nktóre sam tworzy na Twoim Dysku Google. Nic więcej.',
    plannedBannerVerified: (n) => `${n} zweryfikowane`,
    plannedBannerPlanned: (n) => `${n} planowane`,
    months: ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'],
  },
};

export function fmt(n: number, lang: Lang): string {
  if (lang === 'pl') {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 2 }).format(n);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
}

export function fmtShort(n: number, lang: Lang): string {
  if (lang === 'pl') {
    return n >= 1000
      ? (n / 1000).toFixed(1).replace('.', ',') + ' tys. zł'
      : n.toFixed(0) + ' zł';
  }
  return n >= 1000 ? '$' + (n / 1000).toFixed(1) + 'k' : '$' + n.toFixed(0);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/jaqubm/Developer/budgetMe && yarn tsc --noEmit 2>&1 | head -30
```
Expected: No errors from `app/lib/i18n.ts`.

- [ ] **Step 3: Commit**

```bash
git add app/lib/i18n.ts
git commit -m "feat: add i18n translations and currency formatters"
```

---

## Task 2: Create `app/components/LanguageContext.tsx`

**Files:**
- Create: `app/components/LanguageContext.tsx`

- [ ] **Step 1: Create the file**

```tsx
// app/components/LanguageContext.tsx
'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { type Lang, type Translations, translations, fmt as fmtFn, fmtShort as fmtShortFn } from '@/app/lib/i18n';

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
  fmt: (n: number) => string;
  fmtShort: (n: number) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: translations.en,
  fmt: (n) => fmtFn(n, 'en'),
  fmtShort: (n) => fmtShortFn(n, 'en'),
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const stored = localStorage.getItem('budgetMe-lang');
    if (stored === 'en' || stored === 'pl') setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('budgetMe-lang', l);
  };

  const value: LanguageContextValue = {
    lang,
    setLang,
    t: translations[lang],
    fmt: (n) => fmtFn(n, lang),
    fmtShort: (n) => fmtShortFn(n, lang),
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useT() {
  return useContext(LanguageContext);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/jaqubm/Developer/budgetMe && yarn tsc --noEmit 2>&1 | head -30
```
Expected: No errors from `app/components/LanguageContext.tsx`.

- [ ] **Step 3: Commit**

```bash
git add app/components/LanguageContext.tsx
git commit -m "feat: add LanguageProvider and useT hook"
```

---

## Task 3: Wrap layout + disable Next.js dev indicator

**Files:**
- Modify: `app/layout.tsx`
- Modify: `next.config.ts`

- [ ] **Step 1: Update `app/layout.tsx`**

Replace the entire file with:

```tsx
// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/app/components/LanguageContext';

export const metadata: Metadata = {
  title: 'budgetMe',
  description: 'Personal budgeting — data stored on your Google Drive',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Update `next.config.ts`**

Replace the entire file with:

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  distDir: 'build',
  devIndicators: false,
};

export default nextConfig;
```

- [ ] **Step 3: Verify build**

```bash
cd /Users/jaqubm/Developer/budgetMe && yarn tsc --noEmit 2>&1 | head -30
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx next.config.ts
git commit -m "feat: wrap app in LanguageProvider, disable Next.js dev indicator"
```

---

## Task 4: Update `Header.tsx` (mobile header + language toggle)

**Files:**
- Modify: `app/components/Header.tsx`

- [ ] **Step 1: Replace the file**

```tsx
// app/components/Header.tsx
'use client';
import { signOut } from 'next-auth/react';
import { useT } from './LanguageContext';
import type { Lang } from '@/app/lib/i18n';

export function Header() {
  const { t, lang, setLang } = useT();

  return (
    <div style={{ padding: '10px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.4px' }}>budgetMe</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <LangToggle lang={lang} setLang={setLang} />
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
          {t.signOut}
        </button>
      </div>
    </div>
  );
}

export function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div style={{ display: 'flex', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden', fontSize: 11, fontWeight: 700 }}>
      {(['en', 'pl'] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          style={{
            padding: '4px 8px',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 11,
            fontWeight: 700,
            background: lang === l ? 'var(--text)' : 'none',
            color: lang === l ? 'white' : 'var(--text-3)',
            transition: 'all 0.15s',
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/jaqubm/Developer/budgetMe && yarn tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add app/components/Header.tsx
git commit -m "feat: add language toggle to mobile header"
```

---

## Task 5: Update `MonthPicker.tsx`

**Files:**
- Modify: `app/components/MonthPicker.tsx`

- [ ] **Step 1: Replace the file**

```tsx
// app/components/MonthPicker.tsx
'use client';
import { ChevronLeft, ChevronRight, ClockIcon } from './icons';
import { useT } from './LanguageContext';

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
  ym: string;
  todayYm: string;
  onChange: (ym: string) => void;
}

export function MonthPicker({ ym, todayYm, onChange }: Props) {
  const { t } = useT();
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
            {t.months[month - 1]}
          </div>
          <div style={{ fontSize: 12, color: isFuture ? 'oklch(58% 0.07 250)' : 'var(--text-3)', fontWeight: isFuture ? 600 : 500 }}>
            {isFuture ? `${year} · ${t.forecast}` : year}
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
            <ClockIcon /> {t.today}
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/jaqubm/Developer/budgetMe && yarn tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add app/components/MonthPicker.tsx
git commit -m "feat: translate MonthPicker (month names, Today, Forecast)"
```

---

## Task 6: Update `CategoryTabs.tsx`

**Files:**
- Modify: `app/components/CategoryTabs.tsx`

- [ ] **Step 1: Replace the file**

```tsx
// app/components/CategoryTabs.tsx
'use client';
import type { Category } from '@/lib/types';
import { useT } from './LanguageContext';

interface Props {
  active: Category;
  onChange: (cat: Category) => void;
  hasPending: Record<Category, boolean>;
}

export function CategoryTabs({ active, onChange, hasPending }: Props) {
  const { t } = useT();

  const CATEGORIES: { key: Category; label: string; color: string }[] = [
    { key: 'income',   label: t.income,   color: 'var(--income)'  },
    { key: 'expenses', label: t.expenses, color: 'var(--expense)' },
    { key: 'savings',  label: t.savings,  color: 'var(--savings)' },
  ];

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

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/jaqubm/Developer/budgetMe && yarn tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add app/components/CategoryTabs.tsx
git commit -m "feat: translate CategoryTabs labels"
```

---

## Task 7: Update `SummaryCard.tsx`

**Files:**
- Modify: `app/components/SummaryCard.tsx`

- [ ] **Step 1: Replace the file**

```tsx
// app/components/SummaryCard.tsx
'use client';
import type { Entry } from '@/lib/types';
import { useT } from './LanguageContext';

const sumActual  = (arr: Entry[]) => arr.filter(e => !e.planned).reduce((a, b) => a + b.amount, 0);
const sumPlanned = (arr: Entry[]) => arr.filter(e => e.planned).reduce((a, b) => a + b.amount, 0);

interface Props {
  income:   Entry[];
  expenses: Entry[];
  savings:  Entry[];
  isFuture: boolean;
}

export function SummaryCard({ income, expenses, savings, isFuture }: Props) {
  const { t, fmt, fmtShort } = useT();

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
      <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.5, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
        {isFuture ? t.projectedBalance : t.balanceThisMonth}
        {isFuture && (
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', background: 'oklch(100% 0 0 / 0.1)', padding: '2px 6px', borderRadius: 4, opacity: 1 }}>FORECAST</span>
        )}
      </div>

      <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', marginBottom: 14 }}>
        {balance >= 0
          ? <span>{fmt(balance)}{isFuture && <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.5, marginLeft: 6 }}>{t.projected}</span>}</span>
          : <span style={{ color: 'oklch(70% 0.18 22)' }}>{fmt(balance)}</span>
        }
      </div>

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
            <div style={{ fontSize: 9.5, opacity: 0.35, marginTop: 2, fontWeight: 500 }}>{t.thinBarNote}</div>
          </>
        )}
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
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/jaqubm/Developer/budgetMe && yarn tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add app/components/SummaryCard.tsx
git commit -m "feat: translate SummaryCard, switch currency via useT"
```

---

## Task 8: Update `SummaryBar.tsx`

**Files:**
- Modify: `app/components/SummaryBar.tsx`

- [ ] **Step 1: Replace the file**

```tsx
// app/components/SummaryBar.tsx
'use client';
import type { Entry } from '@/lib/types';
import { useT } from './LanguageContext';

const sumActual  = (arr: Entry[]) => arr.filter(e => !e.planned).reduce((a, b) => a + b.amount, 0);
const sumPlanned = (arr: Entry[]) => arr.filter(e => e.planned).reduce((a, b) => a + b.amount, 0);

interface Props {
  income:        Entry[];
  expenses:      Entry[];
  savings:       Entry[];
  isFutureMonth: boolean;
}

export function SummaryBar({ income, expenses, savings, isFutureMonth }: Props) {
  const { t, fmt, fmtShort } = useT();

  const aI = sumActual(income),  pI = sumPlanned(income);
  const aE = sumActual(expenses), pE = sumPlanned(expenses);
  const aS = sumActual(savings),  pS = sumPlanned(savings);
  const tI = aI + pI, tE = aE + pE, tS = aS + pS;
  const balance = tI - tE - tS;
  const total = tI || 1;

  const expPct = Math.min(100, (tE / total) * 100);
  const savPct = Math.min(100, (tS / total) * 100);
  const incPct = Math.max(0, 100 - expPct - savPct);

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
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ height: 6, borderRadius: 3, background: 'oklch(100% 0 0 / 0.12)', overflow: 'hidden', display: 'flex', marginBottom: 8 }}>
          <div style={{ width: `${incPct}%`, background: 'var(--income-mid)', transition: 'width 0.5s' }} />
          <div style={{ width: `${expPct}%`, background: 'var(--expense-mid)', transition: 'width 0.5s' }} />
          <div style={{ width: `${savPct}%`, background: 'var(--savings-mid)', transition: 'width 0.5s' }} />
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
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/jaqubm/Developer/budgetMe && yarn tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add app/components/SummaryBar.tsx
git commit -m "feat: translate SummaryBar, switch currency via useT"
```

---

## Task 9: Update `EntryForm.tsx`

**Files:**
- Modify: `app/components/EntryForm.tsx`

- [ ] **Step 1: Replace the file**

```tsx
// app/components/EntryForm.tsx
'use client';
import { useEffect, useState } from 'react';
import type { Category, Entry } from '@/lib/types';
import { useT } from './LanguageContext';

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
  const { t } = useT();
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
    if (!form.description.trim()) e.description = t.required;
    if (!form.amount || isNaN(+form.amount) || +form.amount <= 0) e.amount = t.invalidAmount;
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
        <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>{t.description}</label>
        <input
          style={inp(errors.description)}
          placeholder={t.descriptionPlaceholder}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          autoFocus
        />
        {errors.description && <div style={{ fontSize: 11, color: 'var(--expense)', marginTop: 2 }}>{errors.description}</div>}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>{t.amount}</label>
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
          <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>{t.date}</label>
          <input
            type="date"
            style={inp()}
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          />
        </div>
      </div>
      <Toggle value={form.planned} onChange={() => setForm((f) => ({ ...f, planned: !f.planned }))} color="var(--planned)" label={t.plannedEntry} sub={t.plannedEntrySub} />
      <Toggle value={form.constant} onChange={() => setForm((f) => ({ ...f, constant: !f.constant }))} color={cat.color} label={t.recurringEntry} sub={t.recurringEntrySub} />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          onClick={onCancel}
          style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          {t.cancel}
        </button>
        <button
          onClick={() => { if (validate()) onSave({ ...form, amount: parseFloat(form.amount) }); }}
          style={{ flex: 2, padding: '10px', borderRadius: 8, border: 'none', background: form.planned ? 'var(--planned)' : cat.color, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          {submitLabel ?? (form.planned ? t.addAsPlanned : t.addEntry)}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/jaqubm/Developer/budgetMe && yarn tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add app/components/EntryForm.tsx
git commit -m "feat: translate EntryForm labels and validation messages"
```

---

## Task 10: Update `EntryRow.tsx`

**Files:**
- Modify: `app/components/EntryRow.tsx`

- [ ] **Step 1: Replace the file**

```tsx
// app/components/EntryRow.tsx
'use client';
import { useRef, useState } from 'react';
import type { Entry } from '@/lib/types';
import { PinIcon, TrashIcon, EditIcon, CheckIcon } from './icons';
import { useT } from './LanguageContext';

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
  const { t, fmt } = useT();
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

      <div style={{
        background: isPlanned ? 'var(--planned-bg)' : 'var(--surface)',
        padding: '11px 12px',
        display: 'flex', alignItems: 'center', gap: 10,
        borderLeft: isPlanned ? '3px dashed var(--planned-border)' : '3px solid transparent',
        transform: swiped ? `translateX(-${swipeWidth}px)` : 'translateX(0)',
        transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
        borderRadius: 10, position: 'relative', zIndex: 1,
      }}>
        <button
          onClick={() => onToggleConstant(index)}
          title={entry.constant ? t.recurring : ''}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, flexShrink: 0, display: 'flex', opacity: isPlanned ? 0.5 : 1 }}
        >
          <PinIcon active={entry.constant} color={isPlanned ? 'var(--planned)' : color} />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: isPlanned ? 'var(--planned)' : 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {entry.description}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span>{entry.date.slice(5).replace('-', '/')}</span>
            {entry.constant && (
              <span style={{ color: isPlanned ? 'var(--planned)' : color, fontWeight: 600, fontSize: 10 }}>{t.recurring}</span>
            )}
            {isPlanned && (
              <span style={{ color: 'var(--planned)', fontWeight: 600, fontSize: 10, background: 'oklch(88% 0.004 260)', padding: '1px 5px', borderRadius: 4 }}>{t.planned}</span>
            )}
          </div>
        </div>

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
              <CheckIcon /> {t.verify}
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
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 500 }}>{t.asPlanned}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/jaqubm/Developer/budgetMe && yarn tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add app/components/EntryRow.tsx
git commit -m "feat: translate EntryRow labels and currency"
```

---

## Task 11: Update `EntrySheet.tsx`

**Files:**
- Modify: `app/components/EntrySheet.tsx`

- [ ] **Step 1: Replace the file**

```tsx
// app/components/EntrySheet.tsx
'use client';
import { useEffect, useState } from 'react';
import type { Category, Entry } from '@/lib/types';
import { useT } from './LanguageContext';

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
  currentYm: string;
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
  const { t } = useT();

  const CAT_COLORS: Record<Category, string> = {
    income:   'var(--income)',
    expenses: 'var(--expense)',
    savings:  'var(--savings)',
  };
  const CAT_LABELS: Record<Category, string> = {
    income:   t.income,
    expenses: t.expenses,
    savings:  t.savings,
  };

  const catColor = CAT_COLORS[category];
  const catLabel = CAT_LABELS[category];
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
    if (!form.description.trim()) e.description = t.required;
    if (!form.amount || isNaN(+form.amount) || +form.amount <= 0) e.amount = t.invalidAmount;
    if (!form.date) e.date = t.required;
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
          {editEntry ? t.editEntry : t.addCategoryEntry(catLabel)}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>{t.description}</label>
            <input
              style={inp(errors.description)}
              placeholder={t.descriptionPlaceholder}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            {errors.description && <div style={{ fontSize: 11, color: 'var(--expense)', marginTop: 3 }}>{errors.description}</div>}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>{t.amount}</label>
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
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>{t.date}</label>
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
            label={t.plannedEntry}
            sub={t.plannedEntrySub}
          />

          <Toggle
            value={form.constant}
            onChange={() => setForm((f) => ({ ...f, constant: !f.constant }))}
            color={catColor}
            label={t.recurringEntry}
            sub={t.recurringEntrySub}
          />
        </div>

        <button
          onClick={handleSave}
          style={{
            width: '100%', marginTop: 20, padding: '14px', borderRadius: 12,
            background: form.planned ? 'var(--planned)' : catColor,
            border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700,
            color: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}
        >
          {editEntry ? t.saveChanges : (form.planned ? t.addAsPlanned : t.addEntry)}
        </button>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/jaqubm/Developer/budgetMe && yarn tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add app/components/EntrySheet.tsx
git commit -m "feat: translate EntrySheet labels and buttons"
```

---

## Task 12: Update `VerifySheet.tsx`

**Files:**
- Modify: `app/components/VerifySheet.tsx`

- [ ] **Step 1: Replace the file**

```tsx
// app/components/VerifySheet.tsx
'use client';
import { useEffect, useState } from 'react';
import type { Entry } from '@/lib/types';
import { CheckIcon } from './icons';
import { useT } from './LanguageContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  entry: Entry | null;
  onVerify: (actualAmount: number) => void;
  color: string;
}

export function VerifySheet({ visible, onClose, entry, onVerify, color }: Props) {
  const { t, fmt } = useT();
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
      setError(t.invalidAmount);
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
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>{t.verifyEntry}</div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>{entry?.description}</div>
        </div>

        <div style={{ margin: '16px 0 4px', padding: '10px 14px', borderRadius: 10, background: 'var(--planned-bg)', border: '1px dashed var(--planned-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--planned)', fontWeight: 500 }}>{t.plannedAmount}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--planned)' }}>{entry ? fmt(entry.amount) : ''}</span>
        </div>

        <div style={{ marginTop: 12, marginBottom: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, display: 'block' }}>{t.actualAmount}</label>
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
            {t.keepPlanned}
          </button>
          <button
            onClick={handle}
            style={{ flex: 2, padding: '13px', borderRadius: 12, border: 'none', background: color, cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
          >
            <CheckIcon /> {t.verify}
          </button>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/jaqubm/Developer/budgetMe && yarn tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add app/components/VerifySheet.tsx
git commit -m "feat: translate VerifySheet labels and currency"
```

---

## Task 13: Update `ConstantBanner.tsx` and `PlannedBanner.tsx`

**Files:**
- Modify: `app/components/ConstantBanner.tsx`
- Modify: `app/components/PlannedBanner.tsx`

- [ ] **Step 1: Replace `ConstantBanner.tsx`**

```tsx
// app/components/ConstantBanner.tsx
'use client';
import { useT } from './LanguageContext';

interface Props {
  onDismiss: () => void;
}

export function ConstantBanner({ onDismiss }: Props) {
  const { t } = useT();

  return (
    <div style={{
      margin: '10px 14px 0', padding: '10px 14px', borderRadius: 10,
      background: 'oklch(93% 0.04 250)', border: '1px solid oklch(85% 0.07 250)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8,
    }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 14 }}>📋</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--savings)', marginBottom: 1 }}>{t.constantBannerTitle}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.4 }}>{t.constantBannerBody}</div>
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

- [ ] **Step 2: Replace `PlannedBanner.tsx`**

```tsx
// app/components/PlannedBanner.tsx
'use client';
import { EyeIcon } from './icons';
import { useT } from './LanguageContext';

interface Props {
  plannedCount: number;
  verifiedCount: number;
}

export function PlannedBanner({ plannedCount, verifiedCount }: Props) {
  const { t } = useT();

  return (
    <div style={{
      margin: '10px 14px 0', padding: '8px 14px', borderRadius: 10,
      background: 'oklch(97% 0.008 250)', border: '1px solid oklch(88% 0.02 250)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <EyeIcon />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'oklch(38% 0.1 250)' }}>{t.forecastMode}</span>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
        {verifiedCount > 0 && (
          <span><span style={{ color: 'oklch(42% 0.12 145)', fontWeight: 700 }}>{verifiedCount}</span> {t.verified}</span>
        )}
        {verifiedCount > 0 && plannedCount > 0 && <span style={{ opacity: 0.3 }}>·</span>}
        {plannedCount > 0 && (
          <span><span style={{ fontWeight: 600 }}>{plannedCount}</span> {t.planned}</span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/jaqubm/Developer/budgetMe && yarn tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
git add app/components/ConstantBanner.tsx app/components/PlannedBanner.tsx
git commit -m "feat: translate ConstantBanner and PlannedBanner"
```

---

## Task 14: Update `CategoryColumn.tsx`

**Files:**
- Modify: `app/components/CategoryColumn.tsx`

- [ ] **Step 1: Replace the file**

```tsx
// app/components/CategoryColumn.tsx
'use client';
import type { Category, Entry } from '@/lib/types';
import { DesktopEntryRow } from './DesktopEntryRow';
import { PlusIcon } from './icons';
import { useT } from './LanguageContext';

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
  const { t, fmt } = useT();
  const actual  = sumActual(entries);
  const planned = sumPlanned(entries);
  const hasPending = entries.some(e => e.planned);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: '1px solid var(--border)' }}>
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '0.02em' }}>{cat.label}</span>
          {hasPending && (
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--planned)', background: 'oklch(92% 0.003 260)', padding: '1px 6px', borderRadius: 4 }}>
              {entries.filter(e => e.planned).length} {t.planned}
            </span>
          )}
        </div>
        <button
          onClick={onAdd}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: 'none', background: cat.light, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: cat.color, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          <PlusIcon /> {isFutureMonth ? t.plan : t.add}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
        {entries.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 12.5 }}>
            {isFutureMonth ? t.planExpected(cat.label.toLowerCase()) : t.noEntriesYet(cat.label.toLowerCase())}
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

      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.total}</span>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: cat.color, letterSpacing: '-0.4px' }}>{fmt(actual + planned)}</div>
          {planned > 0 && <div style={{ fontSize: 10.5, color: 'var(--planned)', fontWeight: 500 }}>{fmt(actual)} {t.actual}</div>}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/jaqubm/Developer/budgetMe && yarn tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add app/components/CategoryColumn.tsx
git commit -m "feat: translate CategoryColumn labels and currency"
```

---

## Task 15: Update `DashboardClient.tsx`

**Files:**
- Modify: `app/dashboard/[year]/[month]/DashboardClient.tsx`

- [ ] **Step 1: Replace the file**

```tsx
// app/dashboard/[year]/[month]/DashboardClient.tsx
'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
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
import { LangToggle } from '@/app/components/Header';
import { useT } from '@/app/components/LanguageContext';

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
  const router    = useRouter();
  const { t, fmt, lang, setLang } = useT();
  const ym        = `${year}-${month}`;
  const isFuture  = ym > todayYm;
  const isDesktop = useIsDesktop();

  const CAT_DEFS = [
    { key: 'income'   as Category, label: t.income,   color: 'var(--income)',   light: 'var(--income-light)'   },
    { key: 'expenses' as Category, label: t.expenses, color: 'var(--expense)',  light: 'var(--expense-light)'  },
    { key: 'savings'  as Category, label: t.savings,  color: 'var(--savings)',  light: 'var(--savings-light)'  },
  ];

  const [data, setData]             = useState<MonthData>(initialData);
  const [activeTab, setActiveTab]   = useState<Category>('income');
  const [showBanner, setShowBanner] = useState(wasNew && !isFuture);
  const [loading, setLoading]       = useState(false);

  const [sheet, setSheet]             = useState<{ open: boolean; editIndex: number | null }>({ open: false, editIndex: null });
  const [verifySheet, setVerifySheet] = useState<{ open: boolean; index: number | null }>({ open: false, index: null });

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

  const mobileEntries  = getEntries(activeTab);
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
    const addCat    = CAT_DEFS.find(c => c.key === addModal.category);
    const editCat   = CAT_DEFS.find(c => c.key === editModal.category);
    const verifyCat = CAT_DEFS.find(c => c.key === verifyModal.category);

    const prevYm = () => {
      const y = parseInt(year), m = parseInt(month);
      return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
    };
    const nextYm = () => {
      const y = parseInt(year), m = parseInt(month);
      return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
    };

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

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => handleChangeMonth(prevYm())}
              style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
            </button>
            <div style={{ textAlign: 'center', minWidth: 140 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                  {t.months[parseInt(month) - 1]} {year}
                </span>
                {isFuture && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'oklch(48% 0.1 250)', background: 'oklch(93% 0.04 250)', padding: '2px 7px', borderRadius: 5, letterSpacing: '0.04em' }}>{t.forecast}</span>
                )}
              </div>
            </div>
            <button
              onClick={() => handleChangeMonth(nextYm())}
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
                {t.today}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LangToggle lang={lang} setLang={setLang} />
            <button
              onClick={() => signOut({ callbackUrl: '/sign-in' })}
              style={{ border: '1px solid var(--border)', background: 'none', borderRadius: 7, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {t.signOut}
            </button>
          </div>
        </div>

        <SummaryBar income={data.income ?? []} expenses={data.expenses ?? []} savings={data.savings ?? []} isFutureMonth={isFuture} />

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

        {addModal.open && addCat && (
          <Modal visible={true} onClose={() => setAddModal({ open: false, category: null })} title={t.addCategoryEntry(addCat.label)} width={420}>
            <EntryForm
              cat={addCat}
              isFutureMonth={isFuture}
              onCancel={() => setAddModal({ open: false, category: null })}
              onSave={(e) => { handleDesktopAdd(addModal.category!, e); setAddModal({ open: false, category: null }); }}
            />
          </Modal>
        )}

        {editModal.open && editCat && editModal.index !== null && (() => {
          const entry = getEntries(editModal.category!)[editModal.index];
          return (
            <Modal visible={true} onClose={() => setEditModal({ open: false, category: null, index: null })} title={t.editCategoryEntry(editCat.label)} width={420}>
              <EntryForm
                cat={editCat}
                isFutureMonth={isFuture}
                initial={{ ...entry, amount: String(entry.amount) }}
                submitLabel={t.saveChanges}
                onCancel={() => setEditModal({ open: false, category: null, index: null })}
                onSave={(e) => { handleDesktopEdit(editModal.category!, editModal.index!, e); setEditModal({ open: false, category: null, index: null }); }}
              />
            </Modal>
          );
        })()}

        {verifyModal.open && verifyCat && verifyModal.index !== null && (() => {
          const entry = getEntries(verifyModal.category!)[verifyModal.index];
          return (
            <Modal visible={true} onClose={() => setVerifyModal({ open: false, category: null, index: null })} title={t.verifyEntry} width={380}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{entry.description}</div>
                <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--planned-bg)', border: '1px dashed var(--planned-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--planned)', fontWeight: 500 }}>{t.plannedAmount}</span>
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
            <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500 }}>{t.noEntriesYet(CAT_DEFS.find(c => c.key === activeTab)!.label.toLowerCase())}</div>
            {isFuture && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{t.planExpected(CAT_DEFS.find(c => c.key === activeTab)!.label.toLowerCase())}</div>}
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
            {t.total} {CAT_DEFS.find(c => c.key === activeTab)!.label}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: mobileCatColor, letterSpacing: '-0.5px' }}>
              {fmt(mobileActual + mobilePlanned)}
            </div>
            {mobilePlanned > 0 && (
              <div style={{ fontSize: 11.5, color: 'var(--planned)', fontWeight: 500 }}>({fmt(mobileActual)} {t.actual})</div>
            )}
          </div>
        </div>
        <button
          onClick={() => setSheet({ open: true, editIndex: null })}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: mobileCatColor, color: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13.5, fontWeight: 700, boxShadow: `0 3px 12px ${mobileCatColor}55`, opacity: loading ? 0.7 : 1 }}
        >
          <PlusIcon /> {isFuture ? t.plan : t.add}
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

function VerifyModalForm({ entry, color, onClose, onVerify }: { entry: Entry; color: string; onClose: () => void; onVerify: (amount: number) => void }) {
  const { t, fmt } = useT();
  const [amount, setAmount] = useState(String(entry.amount));
  const [error, setError]   = useState('');

  const handle = () => {
    if (!amount || isNaN(+amount) || +amount <= 0) { setError(t.invalidAmount); return; }
    onVerify(parseFloat(amount));
  };

  return (
    <>
      <div>
        <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>{t.actualAmount}</label>
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
        <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{t.keepPlanned}</button>
        <button onClick={handle} style={{ flex: 2, padding: '10px', borderRadius: 8, border: 'none', background: color, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>
          {t.verify}
        </button>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/jaqubm/Developer/budgetMe && yarn tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/[year]/[month]/DashboardClient.tsx
git commit -m "feat: translate DashboardClient — month names, labels, modal titles, currency"
```

---

## Task 16: Update `app/sign-in/page.tsx`

**Files:**
- Modify: `app/sign-in/page.tsx`

- [ ] **Step 1: Replace the file**

```tsx
// app/sign-in/page.tsx
'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { GoogleIcon } from '@/app/components/icons';
import { useT } from '@/app/components/LanguageContext';
import { LangToggle } from '@/app/components/Header';

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const { t, lang, setLang } = useT();

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
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 0 0' }}>
        <LangToggle lang={lang} setLang={setLang} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M8 22 L16 10 L24 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="10" y1="18" x2="22" y2="18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>budgetMe</div>
        <div style={{ fontSize: 14, color: 'var(--text-2)', textAlign: 'center', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
          {t.tagline}
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
          {loading ? t.signingIn : t.continueWithGoogle}
        </button>
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-3)', marginTop: 16, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
          {t.driveDisclaimer}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/jaqubm/Developer/budgetMe && yarn tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add app/sign-in/page.tsx
git commit -m "feat: translate sign-in page, add language toggle"
```

---

## Task 17: Final verification

- [ ] **Step 1: Full TypeScript check**

```bash
cd /Users/jaqubm/Developer/budgetMe && yarn tsc --noEmit 2>&1
```
Expected: Zero errors.

- [ ] **Step 2: Lint check**

```bash
cd /Users/jaqubm/Developer/budgetMe && yarn lint 2>&1
```
Expected: No errors.

- [ ] **Step 3: Start dev server and verify manually**

```bash
cd /Users/jaqubm/Developer/budgetMe && yarn dev
```

Open `http://localhost:5137` and verify:
- [ ] No Next.js indicator in the bottom-left corner
- [ ] `EN | PL` toggle appears in the mobile header and desktop nav
- [ ] Switching to PL: all labels change to Polish, amounts switch to PLN format
- [ ] Switching back to EN: labels revert to English, amounts switch to USD
- [ ] Refreshing the page retains the selected language (localStorage persistence)
- [ ] Month names change with the language toggle
- [ ] Sign-in page shows the language toggle and translates on switch
