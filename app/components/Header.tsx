'use client';
import { signOut } from 'next-auth/react';
import { useT } from './LanguageContext';
import { LogoMark } from './Logo';
import type { Lang } from '@/app/lib/i18n';

interface HeaderProps {
  ym?: string;
  todayYm?: string;
  onToday?: () => void;
  disabled?: boolean;
}

export function Header({ ym, todayYm, onToday, disabled }: HeaderProps) {
  const { t, lang, setLang } = useT();
  const showToday = ym && todayYm && ym !== todayYm;

  return (
    <div style={{ padding: '10px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <LogoMark size={28} />
        <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.4px' }}>budgetMe</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {showToday && (
          <button
            onClick={onToday}
            disabled={disabled}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '5px 10px',
              fontSize: 12,
              fontWeight: 600,
              color: disabled ? 'var(--text-3)' : 'var(--text-2)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              opacity: disabled ? 0.4 : 1,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="7" x2="12" y2="12"/><line x1="12" y1="12" x2="16" y2="14"/></svg>
            {t.today}
          </button>
        )}
        <LangToggle lang={lang} setLang={setLang} />
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
          {t.signOut}
        </button>
      </div>
    </div>
  );
}

export function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div style={{ display: 'flex', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden', fontSize: 11, fontWeight: 700 }}>
      {(['en', 'pl'] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          style={{
            padding: '4px 8px',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 11,
            fontWeight: 700,
            background: lang === l ? 'var(--text)' : 'none',
            color: lang === l ? 'white' : 'var(--text-3)',
            transition: 'all 0.15s',
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
