'use client';
import { signOut } from 'next-auth/react';
import { useT } from './LanguageContext';
import { LogoMark } from './Logo';
import type { Lang } from '@/app/lib/i18n';

export function Header() {
  const { t, lang, setLang } = useT();

  return (
    <div style={{ padding: '10px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <LogoMark size={28} />
        <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.4px' }}>budgetMe</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
