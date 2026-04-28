'use client';
import { useEffect, useState } from 'react';
import type { Entry } from '@/lib/types';
import { CheckIcon } from './icons';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

interface Props {
  visible: boolean;
  onClose: () => void;
  entry: Entry | null;
  onVerify: (actualAmount: number) => void;
  color: string;
}

export function VerifySheet({ visible, onClose, entry, onVerify, color }: Props) {
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
      setError('Enter a valid amount');
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
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Verify entry</div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>{entry?.description}</div>
        </div>

        <div style={{ margin: '16px 0 4px', padding: '10px 14px', borderRadius: 10, background: 'var(--planned-bg)', border: '1px dashed var(--planned-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--planned)', fontWeight: 500 }}>Planned amount</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--planned)' }}>{entry ? fmt(entry.amount) : ''}</span>
        </div>

        <div style={{ marginTop: 12, marginBottom: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, display: 'block' }}>Actual amount ($)</label>
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
            Keep planned
          </button>
          <button
            onClick={handle}
            style={{ flex: 2, padding: '13px', borderRadius: 12, border: 'none', background: color, cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
          >
            <CheckIcon /> Verify
          </button>
        </div>
      </div>
    </>
  );
}
