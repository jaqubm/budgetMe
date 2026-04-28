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
