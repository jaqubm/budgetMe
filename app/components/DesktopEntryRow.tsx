'use client';
import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Entry } from '@/lib/types';
import { PinIcon, TrashIcon, EditIcon, CheckIcon } from './icons';
import { useT } from './LanguageContext';

interface Props {
  id: string;
  entry: Entry;
  index: number;
  color: string;
  onDelete: (i: number) => void;
  onToggleConstant: (i: number) => void;
  onEdit: (i: number) => void;
  onVerify: (i: number) => void;
}

export function DesktopEntryRow({ id, entry, index, color, onDelete, onToggleConstant, onEdit, onVerify }: Props) {
  const { t, fmt } = useT();
  const [hovered, setHovered] = useState(false);
  const isPlanned = entry.planned;
  const hasPlannedRecord = !isPlanned && entry.plannedAmount != null;
  const amountChanged = hasPlannedRecord && entry.plannedAmount !== entry.amount;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '20px 1fr auto auto',
        alignItems: 'center',
        gap: 8,
        padding: '7px 10px',
        borderRadius: 8,
        background: isDragging ? 'var(--surface)' : isPlanned ? 'var(--planned-bg)' : (hovered ? 'var(--bg)' : 'transparent'),
        borderLeft: isPlanned ? '2px dashed var(--planned-border)' : '2px solid transparent',
        transition: transition ?? 'background 0.1s',
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 1 : 'auto',
      }}
    >
      <button
        onClick={() => onToggleConstant(index)}
        onPointerDown={e => e.stopPropagation()}
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
          {entry.constant && <span style={{ color: isPlanned ? 'var(--planned)' : color, fontWeight: 600, fontSize: 10 }}>{t.recurring}</span>}
          {isPlanned && <span style={{ color: 'var(--planned)', fontWeight: 600, fontSize: 10, background: 'oklch(88% 0.004 260)', padding: '1px 5px', borderRadius: 3 }}>{t.planned}</span>}
          {entry.fromSavings && <span style={{ color: 'var(--savings)', fontWeight: 600, fontSize: 10, background: 'oklch(93% 0.06 200)', padding: '1px 4px', borderRadius: 3 }}>{t.savings}</span>}
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
          <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{t.asPlanned}</div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 2, maxWidth: hovered ? 200 : 0, overflow: 'hidden', opacity: hovered ? 1 : 0, transition: 'opacity 0.15s, max-width 0.15s', flexShrink: 0 }}>
        {isPlanned && (
          <button
            onClick={() => onVerify(index)}
            onPointerDown={e => e.stopPropagation()}
            style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 7px', borderRadius: 6, background: 'oklch(92% 0.005 260)', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            <CheckIcon /> {t.verify}
          </button>
        )}
        <button
          onClick={() => onEdit(index)}
          onPointerDown={e => e.stopPropagation()}
          style={{ width: 26, height: 26, borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}
        >
          <EditIcon />
        </button>
        <button
          onClick={() => onDelete(index)}
          onPointerDown={e => e.stopPropagation()}
          style={{ width: 26, height: 26, borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}
        >
          <TrashIcon />
        </button>
      </div>

    </div>
  );
}
