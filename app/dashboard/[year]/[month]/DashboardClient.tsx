'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import type { Category, Entry, MonthData } from '@/lib/types';
import { Header } from '@/app/components/Header';
import { MonthPicker } from '@/app/components/MonthPicker';
import { SummaryCard } from '@/app/components/SummaryCard';
import { SummaryBar } from '@/app/components/SummaryBar';
import { CategoryTabs } from '@/app/components/CategoryTabs';
import { CategoryColumn } from '@/app/components/CategoryColumn';
import { GroupedEntryList } from '@/app/components/GroupedEntryList';
import { EntrySheet } from '@/app/components/EntrySheet';
import { VerifySheet } from '@/app/components/VerifySheet';
import { Modal } from '@/app/components/Modal';
import { EntryForm } from '@/app/components/EntryForm';
import { ConstantBanner } from '@/app/components/ConstantBanner';
import { PlannedBanner } from '@/app/components/PlannedBanner';
import { PlusIcon } from '@/app/components/icons';
import { LangToggle } from '@/app/components/Header';
import { LogoMark } from '@/app/components/Logo';
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
  const [startBal, setStartBal]     = useState(initialData.startBalance);
  const [editingBal, setEditingBal] = useState(false);

  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const handleSyncRecurring = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/drive/sync-recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month }),
      });
      const { added } = await res.json() as { added: number };
      if (added > 0) {
        const [incRes, expRes, savRes] = await Promise.all([
          fetch(`/api/drive/entries?year=${year}&month=${month}&category=income`).then(r => r.json()),
          fetch(`/api/drive/entries?year=${year}&month=${month}&category=expenses`).then(r => r.json()),
          fetch(`/api/drive/entries?year=${year}&month=${month}&category=savings`).then(r => r.json()),
        ]);
        setData(d => ({ ...d, income: incRes.entries, expenses: expRes.entries, savings: savRes.entries }));
      }
      setSyncMsg(t.syncRecurringDone(added));
      setTimeout(() => setSyncMsg(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const callSetEntries = useCallback(async (cat: Category, entries: Entry[], grpOrder: string[]) => {
    await fetch('/api/drive/set-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, month, category: cat, entries, groupOrder: grpOrder }),
    });
  }, [year, month]);

  const [sheet, setSheet]             = useState<{ open: boolean; editIndex: number | null }>({ open: false, editIndex: null });
  const [verifySheet, setVerifySheet] = useState<{ open: boolean; index: number | null }>({ open: false, index: null });

  const [addModal,    setAddModal]    = useState<{ open: boolean; category: Category | null }>({ open: false, category: null });
  const [editModal,   setEditModal]   = useState<{ open: boolean; category: Category | null; index: number | null }>({ open: false, category: null, index: null });
  const [verifyModal, setVerifyModal] = useState<{ open: boolean; category: Category | null; index: number | null }>({ open: false, category: null, index: null });

  const getEntries = (cat: Category): Entry[] => data[cat] ?? [];
  const setEntries = (cat: Category, entries: Entry[]) =>
    setData(d => ({ ...d, [cat]: entries }));

  const handleChangeMonth = (newYm: string) => {
    if (loading) return;
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

  const handleSaveStartBal = async (amount: number) => {
    setStartBal(amount);
    setEditingBal(false);
    setLoading(true);
    try {
      await fetch('/api/drive/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month, amount }),
      });
    } finally {
      setLoading(false);
    }
  };

  const mobileEntries  = getEntries(activeTab);
  const mobileCatColor = CAT_DEFS.find(c => c.key === activeTab)!.color;

  const handleMobileEdit = async (entry: Entry) => {
    const idx = sheet.editIndex!;
    setEntries(activeTab, mobileEntries.map((e, i) => i === idx ? entry : e));
    ensureSubCatInOrder(activeTab, entry.subCategory);
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

  function ensureSubCatInOrder(cat: Category, subCategory?: string) {
    if (!subCategory) return;
    setData(d => {
      if (d.groupOrder[cat].includes(subCategory)) return d;
      return { ...d, groupOrder: { ...d.groupOrder, [cat]: [...d.groupOrder[cat], subCategory] } };
    });
  }

  const handleDesktopAdd = async (cat: Category, entry: Entry) => {
    setEntries(cat, [...getEntries(cat), entry]);
    ensureSubCatInOrder(cat, entry.subCategory);
    await callApi('POST', cat, entry);
  };
  const handleDesktopEdit = async (cat: Category, idx: number, entry: Entry) => {
    setEntries(cat, getEntries(cat).map((e, i) => i === idx ? entry : e));
    ensureSubCatInOrder(cat, entry.subCategory);
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

  const handleDesktopEntriesChange = (cat: Category, newEntries: Entry[], newGroupOrder: string[]) => {
    setData(d => ({ ...d, [cat]: newEntries, groupOrder: { ...d.groupOrder, [cat]: newGroupOrder } }));
    setLoading(true);
    callSetEntries(cat, newEntries, newGroupOrder).catch(() => {}).finally(() => setLoading(false));
  };

  const handleMobileAdd = async (entry: Entry) => {
    const newEntries = [...mobileEntries, entry];
    setEntries(activeTab, newEntries);
    ensureSubCatInOrder(activeTab, entry.subCategory);
    await callApi('POST', activeTab, entry);
  };

  const handleMobileEntriesChange = (newEntries: Entry[], newGroupOrder: string[]) => {
    setData(d => ({ ...d, [activeTab]: newEntries, groupOrder: { ...d.groupOrder, [activeTab]: newGroupOrder } }));
    setLoading(true);
    callSetEntries(activeTab, newEntries, newGroupOrder).catch(() => {}).finally(() => setLoading(false));
  };

  const allEntries = [...data.income, ...data.expenses, ...data.savings];
  const plannedCount  = allEntries.filter(e => e.planned).length;
  const verifiedCount = allEntries.filter(e => !e.planned && e.plannedAmount != null).length;
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
      <>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        {/* Top nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LogoMark size={28} />
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>budgetMe</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => handleChangeMonth(prevYm())}
              disabled={loading}
              style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', opacity: loading ? 0.4 : 1 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 140, justifyContent: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                {t.months[parseInt(month) - 1]} {year}
              </span>
              {isFuture && (
                <span style={{ fontSize: 10, fontWeight: 700, color: 'oklch(48% 0.1 250)', background: 'oklch(93% 0.04 250)', padding: '2px 7px', borderRadius: 5, letterSpacing: '0.04em' }}>{t.forecast}</span>
              )}
            </div>
            <button
              onClick={() => handleChangeMonth(nextYm())}
              disabled={loading}
              style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', opacity: loading ? 0.4 : 1 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,18 15,12 9,6"/></svg>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {ym !== todayYm && (
              <button
                onClick={() => handleChangeMonth(todayYm)}
                disabled={loading}
                style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5, opacity: loading ? 0.4 : 1 }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="7" x2="12" y2="12"/><line x1="12" y1="12" x2="16" y2="14"/></svg>
                {t.today}
              </button>
            )}
            <button
              onClick={handleSyncRecurring}
              disabled={loading}
              title={t.syncRecurring}
              style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5, opacity: loading ? 0.4 : 1 }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1,4 1,10 7,10"/><path d="M3.51 15a9 9 0 1 0 .49-3.36"/></svg>
              {t.syncRecurring}
            </button>
            <LangToggle lang={lang} setLang={setLang} />
            <button
              onClick={() => signOut({ callbackUrl: '/sign-in' })}
              style={{ border: '1px solid var(--border)', background: 'none', borderRadius: 7, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {t.signOut}
            </button>
          </div>
        </div>

        <SummaryBar income={data.income ?? []} expenses={data.expenses ?? []} savings={data.savings ?? []} isFutureMonth={isFuture} startBalance={startBal} openingSavings={data.openingSavings} onEditStartBalance={() => setEditingBal(true)} />

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {CAT_DEFS.map(cat => (
            <CategoryColumn
              key={cat.key}
              cat={cat}
              entries={getEntries(cat.key)}
              groupOrder={data.groupOrder[cat.key]}
              isFutureMonth={isFuture}
              onAdd={() => setAddModal({ open: true, category: cat.key })}
              onEdit={(i) => setEditModal({ open: true, category: cat.key, index: i })}
              onDelete={(i) => handleDesktopDelete(cat.key, i)}
              onToggleConstant={(i) => handleDesktopToggleConstant(cat.key, i)}
              onVerify={(i) => setVerifyModal({ open: true, category: cat.key, index: i })}
              onEntriesChange={(newE, newG) => handleDesktopEntriesChange(cat.key, newE, newG)}
            />
          ))}
        </div>

        {addModal.open && addCat && (
          <Modal visible={true} onClose={() => setAddModal({ open: false, category: null })} title={t.addCategoryEntry(addCat.label)} width={420}>
            <EntryForm
              cat={addCat}
              isFutureMonth={isFuture}
              existingSubCategories={data.groupOrder[addModal.category!]}
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
                initial={{ ...entry, amount: String(entry.amount), subCategory: entry.subCategory ?? '' }}
                submitLabel={t.saveChanges}
                existingSubCategories={data.groupOrder[editModal.category!]}
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
      <StartBalanceEditor visible={editingBal} current={startBal} isDesktop={true} onSave={handleSaveStartBal} onClose={() => setEditingBal(false)} />
      <SavingToast visible={loading} isDesktop={true} />
      <SyncToast message={syncMsg} isDesktop={true} />
</>
    );
  }

  /* ── Mobile layout ──────────────────────────────────────── */
  return (
    <div style={{ height: '100svh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
      <Header ym={ym} todayYm={todayYm} onToday={() => handleChangeMonth(todayYm)} disabled={loading} />
      <MonthPicker ym={ym} todayYm={todayYm} onChange={handleChangeMonth} disabled={loading} />
      <SummaryCard income={data.income ?? []} expenses={data.expenses ?? []} savings={data.savings ?? []} isFuture={isFuture} startBalance={startBal} openingSavings={data.openingSavings} onEditStartBalance={() => setEditingBal(true)} />

      {showBanner && !isFuture && <ConstantBanner onDismiss={() => setShowBanner(false)} />}
      {isFuture && plannedCount > 0 && <PlannedBanner plannedCount={plannedCount} verifiedCount={verifiedCount} />}

      <CategoryTabs active={activeTab} onChange={setActiveTab} hasPending={hasPending} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 14px 0' }}>
        <button
          onClick={handleSyncRecurring}
          disabled={loading}
          style={{ background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, padding: '2px 0', opacity: loading ? 0.4 : 1 }}
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1,4 1,10 7,10"/><path d="M3.51 15a9 9 0 1 0 .49-3.36"/></svg>
          {t.syncRecurring}
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {mobileEntries.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 40 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 22 }}>💸</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500 }}>{t.noEntriesYet(CAT_DEFS.find(c => c.key === activeTab)!.label.toLowerCase())}</div>
            {isFuture && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{t.planExpected(CAT_DEFS.find(c => c.key === activeTab)!.label.toLowerCase())}</div>}
          </div>
        ) : (
          <GroupedEntryList
            entries={mobileEntries}
            groupOrder={data.groupOrder[activeTab]}
            catKey={activeTab}
            catColor={mobileCatColor}
            isDesktop={false}
            onEdit={(i) => setSheet({ open: true, editIndex: i })}
            onDelete={handleMobileDelete}
            onToggleConstant={handleMobileToggleConstant}
            onVerify={(i) => setVerifySheet({ open: true, index: i })}
            onEntriesChange={handleMobileEntriesChange}
          />
        )}
      </div>

      <div style={{ padding: '10px 14px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 16px))', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
        existingSubCategories={data.groupOrder[activeTab]}
      />

      <VerifySheet
        visible={verifySheet.open}
        onClose={() => setVerifySheet(s => ({ ...s, open: false }))}
        entry={verifySheet.index !== null ? mobileEntries[verifySheet.index] : null}
        onVerify={handleMobileVerify}
        color={mobileCatColor}
      />
      <StartBalanceEditor visible={editingBal} current={startBal} isDesktop={false} onSave={handleSaveStartBal} onClose={() => setEditingBal(false)} />
      <SavingToast visible={loading} isDesktop={false} />
      <SyncToast message={syncMsg} isDesktop={false} />
    </div>
  );
}

function StartBalanceEditor({ visible, current, isDesktop, onSave, onClose }: {
  visible: boolean; current: number; isDesktop: boolean;
  onSave: (n: number) => void; onClose: () => void;
}) {
  const { t, lang } = useT();
  const [val, setVal]   = useState(String(current));
  const [err, setErr]   = useState('');

  useEffect(() => {
    if (visible) { setVal(String(current)); setErr(''); }
  }, [visible, current]);

  const commit = () => {
    const n = parseFloat(val);
    if (isNaN(n)) { setErr(t.invalidAmount); return; }
    onSave(n);
  };

  const inp: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: `1.5px solid ${err ? 'var(--expense)' : 'var(--border)'}`,
    fontSize: 20, fontWeight: 700, textAlign: 'center',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    color: 'var(--text)', background: 'var(--bg)', outline: 'none',
    letterSpacing: '-0.5px',
  };

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>{t.startBalanceSub}</div>
      <div>
        <input
          type="number" step="0.01" autoFocus
          style={inp}
          value={val}
          placeholder={lang === 'pl' ? '0,00' : '0.00'}
          onChange={e => { setVal(e.target.value); setErr(''); }}
          onKeyDown={e => e.key === 'Enter' && commit()}
        />
        {err && <div style={{ fontSize: 11, color: 'var(--expense)', marginTop: 3 }}>{err}</div>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', fontFamily: 'inherit' }}>{t.cancel}</button>
        <button onClick={commit} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: 'var(--text)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'white', fontFamily: 'inherit' }}>{t.saveChanges}</button>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Modal visible={visible} onClose={onClose} title={t.setStartBalance} width={360}>
        {content}
      </Modal>
    );
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'oklch(0% 0 0 / 0.35)', zIndex: 50, opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none', transition: 'opacity 0.25s' }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 51,
        background: 'var(--surface)', borderRadius: '20px 20px 0 0',
        padding: '20px 20px 40px',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: '0 -4px 32px oklch(0% 0 0 / 0.15)',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 16px' }} />
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 18 }}>{t.setStartBalance}</div>
        {content}
      </div>
    </>
  );
}

function SavingToast({ visible, isDesktop }: { visible: boolean; isDesktop: boolean }) {
  const { t } = useT();
  return (
    <div style={{
      position: 'fixed',
      bottom: isDesktop ? '24px' : 'calc(80px + env(safe-area-inset-bottom, 0px))',
      left: '50%',
      transform: `translateX(-50%) translateY(${visible ? 0 : 8}px)`,
      zIndex: 200,
      background: 'var(--text)',
      color: 'white',
      padding: '8px 14px 8px 10px',
      borderRadius: 20,
      fontSize: 12.5,
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      boxShadow: '0 4px 20px oklch(0% 0 0 / 0.3)',
      opacity: visible ? 1 : 0,
      pointerEvents: 'none',
      transition: 'opacity 0.18s, transform 0.18s',
      whiteSpace: 'nowrap',
    }}>
      <div style={{
        width: 14,
        height: 14,
        borderRadius: '50%',
        border: '2px solid oklch(100% 0 0 / 0.3)',
        borderTopColor: 'white',
        animation: 'spin 0.7s linear infinite',
        flexShrink: 0,
      }} />
      {t.saving}
    </div>
  );
}

function SyncToast({ message, isDesktop }: { message: string | null; isDesktop: boolean }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: isDesktop ? '24px' : 'calc(80px + env(safe-area-inset-bottom, 0px))',
      left: '50%',
      transform: `translateX(-50%) translateY(${message ? 0 : 8}px)`,
      zIndex: 200,
      background: 'var(--text)',
      color: 'white',
      padding: '8px 14px',
      borderRadius: 20,
      fontSize: 12.5,
      fontWeight: 600,
      boxShadow: '0 4px 20px oklch(0% 0 0 / 0.3)',
      opacity: message ? 1 : 0,
      pointerEvents: 'none',
      transition: 'opacity 0.18s, transform 0.18s',
      whiteSpace: 'nowrap',
    }}>
      {message}
    </div>
  );
}

function VerifyModalForm({ entry, color, onClose, onVerify }: { entry: Entry; color: string; onClose: () => void; onVerify: (amount: number) => void }) {
  const { t } = useT();
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
