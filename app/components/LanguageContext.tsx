// app/components/LanguageContext.tsx
'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { type Lang, type Translations, translations, fmt as fmtFn, fmtShort as fmtShortFn } from '@/app/lib/i18n';

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
  fmt: (n: number) => string;
  fmtShort: (n: number) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: translations.en,
  fmt: (n) => fmtFn(n, 'en'),
  fmtShort: (n) => fmtShortFn(n, 'en'),
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const stored = localStorage.getItem('budgetMe-lang');
    if (stored === 'en' || stored === 'pl') setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('budgetMe-lang', l);
  };

  const value: LanguageContextValue = {
    lang,
    setLang,
    t: translations[lang],
    fmt: (n) => fmtFn(n, lang),
    fmtShort: (n) => fmtShortFn(n, lang),
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useT() {
  return useContext(LanguageContext);
}
