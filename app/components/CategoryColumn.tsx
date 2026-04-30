'use client';
import type { Category, Entry } from '@/lib/types';
import { GroupedEntryList } from './GroupedEntryList';
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
  groupOrder: string[];
  isFutureMonth: boolean;
  onAdd: () => void;
  onEdit: (i: number) => void;
  onDelete: (i: number) => void;
  onToggleConstant: (i: number) => void;
  onVerify: (i: number) => void;
  onEntriesChange: (newEntries: Entry[], newGroupOrder: string[]) => void;
}

export function CategoryColumn({ cat, entries, groupOrder, isFutureMonth, onAdd, onEdit, onDelete, onToggleConstant, onVerify, onEntriesChange }: Props) {
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
          <GroupedEntryList
            entries={entries}
            groupOrder={groupOrder}
            catKey={cat.key}
            catColor={cat.color}
            isDesktop={true}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleConstant={onToggleConstant}
            onVerify={onVerify}
            onEntriesChange={onEntriesChange}
          />
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
