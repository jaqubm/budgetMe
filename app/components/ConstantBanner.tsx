'use client';

interface Props {
  onDismiss: () => void;
}

export function ConstantBanner({ onDismiss }: Props) {
  return (
    <div style={{
      margin: '10px 14px 0', padding: '10px 14px', borderRadius: 10,
      background: 'oklch(93% 0.04 250)', border: '1px solid oklch(85% 0.07 250)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8,
    }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 14 }}>📋</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--savings)', marginBottom: 1 }}>Pre-populated from last month</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.4 }}>Recurring entries were carried over. You can remove or toggle them off.</div>
        </div>
      </div>
      <button
        onClick={onDismiss}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 16, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}
      >
        ×
      </button>
    </div>
  );
}
