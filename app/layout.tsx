import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'budgetMe',
  description: 'Personal budgeting — data stored on your Google Drive',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
