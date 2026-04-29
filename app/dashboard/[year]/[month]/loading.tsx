export default function DashboardLoading() {
  return (
    <>
      {/* ── Mobile skeleton ─────────────────────────────── */}
      <div className="loading-mobile" style={{ height: '100svh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '10px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.4px' }}>budgetMe</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bone width={52} height={26} radius={8} />
            <Bone width={64} height={28} radius={8} />
          </div>
        </div>

        {/* MonthPicker */}
        <div style={{ padding: '10px 14px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Bone width={32} height={32} radius={8} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <Bone width={100} height={19} radius={6} />
              <Bone width={52} height={14} radius={5} />
            </div>
            <Bone width={32} height={32} radius={8} />
          </div>
        </div>

        {/* SummaryCard */}
        <div style={{ margin: '10px 14px', borderRadius: 16, background: 'var(--text)', padding: '16px 18px', boxShadow: '0 4px 20px oklch(0% 0 0 / 0.15)' }}>
          <Bone width={120} height={11} radius={4} color="oklch(100% 0 0 / 0.15)" />
          <div style={{ marginTop: 8, marginBottom: 14 }}>
            <Bone width={140} height={34} radius={6} color="oklch(100% 0 0 / 0.15)" />
          </div>
          <Bone width="100%" height={6} radius={3} color="oklch(100% 0 0 / 0.15)" />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <Bone width={52} height={11} radius={4} color="oklch(100% 0 0 / 0.15)" />
                <Bone width={60} height={16} radius={4} color="oklch(100% 0 0 / 0.15)" />
              </div>
            ))}
          </div>
        </div>

        {/* CategoryTabs */}
        <div style={{ display: 'flex', gap: 6, padding: '12px 14px 0' }}>
          {[1, 2, 3].map(i => <Bone key={i} width="33%" height={34} radius={10} />)}
        </div>

        {/* Entry rows */}
        <div style={{ flex: 1, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden' }}>
          {[1, 2, 3, 4].map(i => <Bone key={i} width="100%" height={56} radius={12} />)}
        </div>

        {/* Bottom bar */}
        <div style={{ padding: '10px 14px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 16px))', borderTop: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Bone width={80} height={11} radius={4} />
            <Bone width={100} height={20} radius={5} />
          </div>
          <Bone width={90} height={42} radius={12} />
        </div>
      </div>

      {/* ── Desktop skeleton ─────────────────────────────── */}
      <div className="loading-desktop" style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        {/* Top nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
                <path d="M8 22 L16 10 L24 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="10" y1="18" x2="22" y2="18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>budgetMe</span>
          </div>
          <Bone width={180} height={24} radius={8} />
          <Bone width={120} height={28} radius={7} />
        </div>

        {/* Summary bar */}
        <div style={{ display: 'flex', padding: '10px 20px', gap: 16, background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          {[1, 2, 3].map(i => <Bone key={i} width="33%" height={48} radius={10} />)}
        </div>

        {/* Three column skeletons */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {[1, 2, 3].map(col => (
            <div key={col} style={{ flex: 1, borderRight: col < 3 ? '1px solid var(--border)' : undefined, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Bone width="60%" height={20} radius={6} />
              {[1, 2, 3, 4].map(i => <Bone key={i} width="100%" height={52} radius={10} />)}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .loading-mobile  { display: flex;  }
        .loading-desktop { display: none;  }
        @media (min-width: 768px) {
          .loading-mobile  { display: none;  }
          .loading-desktop { display: flex;  }
        }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </>
  );
}

function Bone({ width, height, radius, color }: { width: number | string; height: number; radius: number; color?: string }) {
  const base = color ?? 'var(--border)';
  const highlight = color ?? 'var(--bg)';
  return (
    <div style={{
      width,
      height,
      borderRadius: radius,
      background: `linear-gradient(90deg, ${base} 25%, ${highlight} 50%, ${base} 75%)`,
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite linear',
      flexShrink: 0,
    }} />
  );
}
