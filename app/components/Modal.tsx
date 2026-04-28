'use client';
import { useEffect } from 'react';

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
}

export function Modal({ visible, onClose, title, children, width = 440 }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (visible) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'oklch(0% 0 0 / 0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.15s ease' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width, background: 'var(--surface)', borderRadius: 16, boxShadow: '0 8px 40px oklch(0% 0 0 / 0.2)', animation: 'modalIn 0.2s cubic-bezier(0.4,0,0.2,1)', overflow: 'hidden' }}
      >
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 20, lineHeight: 1, padding: '0 2px', display: 'flex', alignItems: 'center' }}>×</button>
        </div>
        <div style={{ padding: '18px 20px 20px' }}>{children}</div>
      </div>
    </div>
  );
}
