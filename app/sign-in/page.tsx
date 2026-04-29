'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { GoogleIcon } from '@/app/components/icons';
import { useT } from '@/app/components/LanguageContext';
import { LangToggle } from '@/app/components/Header';
import { LogoMark } from '@/app/components/Logo';

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const { t, lang, setLang } = useT();

  const handleSignIn = async () => {
    setLoading(true);
    await signIn('google', { callbackUrl: '/' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)',
      padding: '0 28px',
      maxWidth: 430,
      margin: '0 auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 0 0' }}>
        <LangToggle lang={lang} setLang={setLang} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div style={{ marginBottom: 4 }}>
          <LogoMark size={64} />
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>budgetMe</div>
        <div style={{ fontSize: 14, color: 'var(--text-2)', textAlign: 'center', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
          {t.tagline}
        </div>
      </div>

      <div style={{ paddingBottom: 48 }}>
        <button
          onClick={handleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px 20px',
            border: '1.5px solid var(--border)',
            borderRadius: 14,
            background: 'var(--surface)',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--text)',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            opacity: loading ? 0.7 : 1,
            boxShadow: '0 1px 6px oklch(0% 0 0 / 0.05)',
          }}
        >
          {loading ? (
            <div style={{ width: 20, height: 20, border: '2px solid var(--border)', borderTopColor: 'var(--text)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          ) : (
            <GoogleIcon />
          )}
          {loading ? t.signingIn : t.continueWithGoogle}
        </button>
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-3)', marginTop: 16, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
          {t.driveDisclaimer}
        </p>
      </div>
    </div>
  );
}
