'use client';
import { useState } from 'react';
import type { Entry } from '@/lib/types';
import { PinIcon, TrashIcon, EditIcon, CheckIcon } from './icons';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

interface Props {
  entry: Entry;
  index: number;
  color: string;
  onDelete: (i: number) => void;
  onToggleConstant: (i: number) => void;
  onEdit: (i: number) => void;
  onVerify: (i: number) => void;
}

export function DesktopEntryRow({ entry, index, color, onDelete, onToggleConstant, onEdit, onVerify }: Props) {
  const [hovered, setHovered] = useState(false);
  const isPlanned = entry.planned;
  const hasPlannedRecord = !isPlanned && entry.plannedAmount != null;
  const amountChanged = hasPlannedRecord && entry.plannedAmount !== entry.amount;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '20px 1fr auto auto',
        alignItems: 'center',
        gap: 8,
        padding: '7px 10px',
        borderRadius: 8,
        background: isPlanned ? 'var(--planned-bg)' : (hovered ? 'var(--bg)' : 'transparent'),
        borderLeft: isPlanned ? '2px dashed var(--planned-border)' : '2px solid transparent',
        transition: 'background 0.1s',
        cursor: 'default',
      }}
    >
      <button
        onClick={() => onToggleConstant(index)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', opacity: isPlanned ? 0.5 : 1, borderRadius: 4 }}
      >
        <PinIcon active={entry.constant} color={isPlanned ? 'var(--planned)' : color} />
      </button>

      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: isPlanned ? 'var(--planned)' : 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {entry.description}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
          <span>{entry.date.slice(5).replace('-', '/')}</span>
          {entry.constant && <span style={{ color: isPlanned ? 'var(--planned)' : color, fontWeight: 600, fontSize: 10 }}>recurring</span>}
          {isPlanned && <span style={{ color: 'var(--planned)', fontWeight: 600, fontSize: 10, background: 'oklch(88% 0.004 260)', padding: '1px 5px', borderRadius: 3 }}>planned</span>}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: isPlanned ? 'var(--planned)' : color }}>
          {fmt(entry.amount)}
        </div>
        {hasPlannedRecord && amountChanged && (
          <div style={{ fontSize: 10, color: 'var(--text-3)', textDecoration: 'line-through', textDecorationColor: 'oklch(80% 0 0)' }}>
            {fmt(entry.plannedAmount!)}
          </div>
        )}
        {hasPlannedRecord && !amountChanged && (
          <div style={{ fontSize: 10, color: 'var(--text-3)' }}>as planned</div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 2, opacity: hovered ? 1 : 0, transition: 'opacity 0.15s', flexShrink: 0 }}>
        {isPlanned ? (
          <button
            onClick={() => onVerify(index)}
            title="Verify"
            style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 7px', borderRadius: 6, background: 'oklch(92% 0.005 260)', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            <CheckIcon /> Verify
          </button>
        ) : (
          <button
            onClick={() => onEdit(index)}
            title="Edit"
            style={{ width: 26, height: 26, borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}
          >
            <EditIcon />
          </button>
        )}
        <button
          onClick={() => onDelete(index)}
          title="Delete"
          style={{ width: 26, height: 26, borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}
