'use client';
import { ChevronLeft, ChevronRight } from './icons';
import { useT } from './LanguageContext';

function parseYM(ym: string) {
  const [y, m] = ym.split('-');
  return { year: parseInt(y), month: parseInt(m) };
}

function prevYM(ym: string) {
  let { year, month } = parseYM(ym);
  month--;
  if (month < 1) { month = 12; year--; }
  return `${year}-${String(month).padStart(2, '0')}`;
}

function nextYM(ym: string) {
  let { year, month } = parseYM(ym);
  month++;
  if (month > 12) { month = 1; year++; }
  return `${year}-${String(month).padStart(2, '0')}`;
}

interface Props {
  ym: string;
  todayYm: string;
  onChange: (ym: string) => void;
  disabled?: boolean;
}

export function MonthPicker({ ym, todayYm, onChange, disabled }: Props) {
  const { t } = useT();
  const { year, month } = parseYM(ym);
  const isFuture = ym > todayYm;

  return (
    <div style={{ padding: '10px 14px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => onChange(prevYM(ym))}
          disabled={disabled}
          style={{ background: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', color: disabled ? 'var(--text-3)' : 'var(--text)', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', opacity: disabled ? 0.4 : 1 }}
        >
          <ChevronLeft />
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            {t.months[month - 1]}
          </div>
          <div style={{ fontSize: 12, color: isFuture ? 'oklch(58% 0.07 250)' : 'var(--text-3)', fontWeight: isFuture ? 600 : 500 }}>
            {isFuture ? `${year} · ${t.forecast}` : year}
          </div>
        </div>

        <button
          onClick={() => onChange(nextYM(ym))}
          disabled={disabled}
          style={{ background: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', color: disabled ? 'var(--text-3)' : 'var(--text)', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', opacity: disabled ? 0.4 : 1 }}
        >
          <ChevronRight />
        </button>
      </div>

    </div>
  );
}
