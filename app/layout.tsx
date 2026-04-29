import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/app/components/LanguageContext';

export const metadata: Metadata = {
  title: 'budgetMe',
  description: 'Personal budgeting — data stored on your Google Drive',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
