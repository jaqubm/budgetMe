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
