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
  fromSavings: boolean;
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
    initial ?? { date: today, amount: '', description: '', constant: false, planned: isFutureMonth, fromSavings: false }
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    setForm(initial ?? { date: today, amount: '', description: '', constant: false, planned: isFutureMonth, fromSavings: false });
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
      {cat.key !== 'savings' && (
        <Toggle value={form.fromSavings} onChange={() => setForm((f) => ({ ...f, fromSavings: !f.fromSavings }))} color="var(--savings)" label={t.fromSavings} sub={t.fromSavingsSub} />
      )}
      <Toggle value={form.constant} onChange={() => setForm((f) => ({ ...f, constant: !f.constant }))} color={cat.color} label={t.recurringEntry} sub={t.recurringEntrySub} />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          onClick={onCancel}
          style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          {t.cancel}
        </button>
        <button
          onClick={() => { if (validate()) onSave({ ...form, amount: parseFloat(form.amount), plannedAmount: undefined }); }}
          style={{ flex: 2, padding: '10px', borderRadius: 8, border: 'none', background: form.planned ? 'var(--planned)' : cat.color, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          {submitLabel ?? (form.planned ? t.addAsPlanned : t.addEntry)}
        </button>
      </div>
    </div>
  );
}
