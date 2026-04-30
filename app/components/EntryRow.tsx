'use client';
import { useRef, useState } from 'react';
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

export function EntryRow({ id, entry, index, color, onDelete, onToggleConstant, onEdit, onVerify }: Props) {
  const { t, fmt } = useT();
  const [swiped, setSwiped] = useState(false);
  const touchStart = useRef<number | null>(null);
  const isPlanned = entry.planned;
  const swipeWidth = 112;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (dx < -40) setSwiped(true);
    else if (dx > 20) setSwiped(false);
    touchStart.current = null;
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 10,
        transform: CSS.Transform.toString(transform),
        transition: transition ?? undefined,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1 : 0,
        isolation: 'isolate',
      }}
    >
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0,
        width: swipeWidth + 8,
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        gap: 4, padding: '0 8px',
      }}>
        <button
          onClick={() => onEdit(index)}
          style={{ width: 38, height: 38, borderRadius: 10, background: 'oklch(88% 0.06 240)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--savings)' }}
        >
          <EditIcon />
        </button>
        <button
          onClick={() => onDelete(index)}
          style={{ width: 38, height: 38, borderRadius: 10, background: 'oklch(88% 0.06 22)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--expense)' }}
        >
          <TrashIcon />
        </button>
      </div>

      <div
        {...listeners}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          background: isPlanned ? 'var(--planned-bg)' : 'var(--surface)',
          padding: '11px 12px',
          display: 'flex', alignItems: 'center', gap: 10,
          borderLeft: isPlanned ? '3px dashed var(--planned-border)' : '3px solid transparent',
          transform: swiped ? `translateX(-${swipeWidth}px)` : 'translateX(0)',
          transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
          borderRadius: 10, position: 'relative',
          touchAction: 'pan-y',
        }}
      >
        <button
          onClick={() => onToggleConstant(index)}
          title={entry.constant ? t.recurring : ''}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, flexShrink: 0, display: 'flex', opacity: isPlanned ? 0.5 : 1 }}
        >
          <PinIcon active={entry.constant} color={isPlanned ? 'var(--planned)' : color} />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: isPlanned ? 'var(--planned)' : 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {entry.description}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span>{entry.date.slice(5).replace('-', '/')}</span>
            {entry.constant && (
              <span style={{ color: isPlanned ? 'var(--planned)' : color, fontWeight: 600, fontSize: 10 }}>{t.recurring}</span>
            )}
            {isPlanned && (
              <span style={{ color: 'var(--planned)', fontWeight: 600, fontSize: 10, background: 'oklch(88% 0.004 260)', padding: '1px 5px', borderRadius: 4 }}>{t.planned}</span>
            )}
            {entry.fromSavings && (
              <span style={{ color: 'var(--savings)', fontWeight: 600, fontSize: 10, background: 'oklch(93% 0.06 200)', padding: '1px 5px', borderRadius: 4 }}>{t.savings}</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {isPlanned && (
            <button
              onClick={() => onVerify(index)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '5px 9px', borderRadius: 7,
                background: 'oklch(90% 0.005 260)', border: 'none', cursor: 'pointer',
                fontSize: 11.5, fontWeight: 700, color: 'var(--text-2)',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              <CheckIcon /> {t.verify}
            </button>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: isPlanned ? 'var(--planned)' : color }}>
              {fmt(entry.amount)}
            </div>
            {!isPlanned && entry.plannedAmount != null && entry.plannedAmount !== entry.amount && (
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 500, textDecoration: 'line-through', textDecorationColor: 'oklch(78% 0 0)' }}>
                {fmt(entry.plannedAmount)}
              </div>
            )}
            {!isPlanned && entry.plannedAmount != null && entry.plannedAmount === entry.amount && (
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 500 }}>{t.asPlanned}</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
