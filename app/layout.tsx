import type { Metadata } from 'next';
import { Analytics } from "@vercel/analytics/next"
import './globals.css';
import { LanguageProvider } from '@/app/components/LanguageContext';
import { HtmlLang } from '@/app/components/HtmlLang';

export const metadata: Metadata = {
  title: 'budgetMe',
  description: 'Personal budgeting — data stored on your Google Drive',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <Analytics />
          <HtmlLang />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
