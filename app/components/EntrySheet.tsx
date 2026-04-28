'use client';
import { useEffect, useState } from 'react';
import type { Category, Entry } from '@/lib/types';

const CATEGORIES: { key: Category; label: string; color: string }[] = [
  { key: 'income',   label: 'Income',   color: 'var(--income)'  },
  { key: 'expenses', label: 'Expenses', color: 'var(--expense)' },
  { key: 'savings',  label: 'Savings',  color: 'var(--savings)' },
];

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
  currentYm: string; // "YYYY-MM" used for default date
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
  const cat = CATEGORIES.find((c) => c.key === category)!;
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
    if (!form.description.trim()) e.description = 'Required';
    if (!form.amount || isNaN(+form.amount) || +form.amount <= 0) e.amount = 'Enter a valid amount';
    if (!form.date) e.date = 'Required';
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
          {editEntry ? 'Edit entry' : `Add ${cat.label} entry`}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>Description</label>
            <input
              style={inp(errors.description)}
              placeholder="e.g. Monthly Salary"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            {errors.description && <div style={{ fontSize: 11, color: 'var(--expense)', marginTop: 3 }}>{errors.description}</div>}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>Amount ($)</label>
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
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>Date</label>
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
            label="Planned entry"
            sub="Expected amount — verify when it happens"
          />

          <Toggle
            value={form.constant}
            onChange={() => setForm((f) => ({ ...f, constant: !f.constant }))}
            color={cat.color}
            label="Recurring entry"
            sub="Automatically carry over to next month"
          />
        </div>

        <button
          onClick={handleSave}
          style={{
            width: '100%', marginTop: 20, padding: '14px', borderRadius: 12,
            background: form.planned ? 'var(--planned)' : cat.color,
            border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700,
            color: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}
        >
          {editEntry ? 'Save changes' : (form.planned ? 'Add as planned' : 'Add entry')}
        </button>
      </div>
    </>
  );
}
