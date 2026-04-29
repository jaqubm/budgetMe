'use client';
import { EyeIcon } from './icons';
import { useT } from './LanguageContext';

interface Props {
  plannedCount: number;
  verifiedCount: number;
}

export function PlannedBanner({ plannedCount, verifiedCount }: Props) {
  const { t } = useT();

  return (
    <div style={{
      margin: '10px 14px 0', padding: '8px 14px', borderRadius: 10,
      background: 'oklch(97% 0.008 250)', border: '1px solid oklch(88% 0.02 250)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <EyeIcon />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'oklch(38% 0.1 250)' }}>{t.forecastMode}</span>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
        {verifiedCount > 0 && (
          <span><span style={{ color: 'oklch(42% 0.12 145)', fontWeight: 700 }}>{verifiedCount}</span> {t.verified}</span>
        )}
        {verifiedCount > 0 && plannedCount > 0 && <span style={{ opacity: 0.3 }}>·</span>}
        {plannedCount > 0 && (
          <span><span style={{ fontWeight: 600 }}>{plannedCount}</span> {t.planned}</span>
        )}
      </div>
    </div>
  );
}
