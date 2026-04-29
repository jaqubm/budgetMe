'use client';
import { useEffect } from 'react';
import { useT } from './LanguageContext';

export function HtmlLang() {
  const { lang } = useT();
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return null;
}
