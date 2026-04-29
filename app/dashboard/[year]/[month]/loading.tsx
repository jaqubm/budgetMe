export default function DashboardLoading() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Top bar skeleton */}
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

      {/* Summary bar skeleton */}
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

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </div>
  );
}

function Bone({ width, height, radius }: { width: number | string; height: number; radius: number }) {
  return (
    <div style={{
      width,
      height,
      borderRadius: radius,
      background: 'linear-gradient(90deg, var(--border) 25%, var(--bg) 50%, var(--border) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite linear',
      flexShrink: 0,
    }} />
  );
}
