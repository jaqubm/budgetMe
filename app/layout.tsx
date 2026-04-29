import type { Metadata } from 'next';
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import './globals.css';
import { LanguageProvider } from '@/app/components/LanguageContext';
import { HtmlLang } from '@/app/components/HtmlLang';

export const metadata: Metadata = {
  title: 'budgetMe',
  description: 'Track income, expenses and savings — all stored privately on your Google Drive.',
  openGraph: {
    title: 'budgetMe',
    description: 'Track income, expenses and savings — all stored privately on your Google Drive.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'budgetMe',
    description: 'Track income, expenses and savings — all stored privately on your Google Drive.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <SpeedInsights/>
          <Analytics />
          <HtmlLang />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
