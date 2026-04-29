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
