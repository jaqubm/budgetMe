'use client';
import { signOut } from 'next-auth/react';

export function Header() {
  return (
    <div style={{ padding: '10px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.4px' }}>budgetMe</div>
      <button
        onClick={() => signOut({ callbackUrl: '/sign-in' })}
        style={{
          background: 'none',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '5px 10px',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-2)',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        Sign out
      </button>
    </div>
  );
}
