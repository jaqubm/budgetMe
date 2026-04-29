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
