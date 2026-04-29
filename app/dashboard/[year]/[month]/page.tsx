import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { initAndGetMonth } from '@/lib/google-drive';
import type { MonthData } from '@/lib/types';
import { DashboardClient } from './DashboardClient';

interface Props {
  params: Promise<{ year: string; month: string }>;
}

export default async function DashboardPage({ params }: Props) {
  const { year, month } = await params;
  const session = await auth();
  if (!session?.accessToken || session.error === 'RefreshTokenError') redirect('/sign-in');

  const now = new Date();
  const todayYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const isFutureMth = `${year}-${month}` > todayYm;

  const { wasNew, income, expenses, savings } = await initAndGetMonth(
    session.accessToken, year, month
  );

  const markPlanned = (entries: typeof income) =>
    isFutureMth ? entries.map(e => ({ ...e, planned: e.planned ?? true })) : entries;

  const initialData: MonthData = {
    income:   markPlanned(income),
    expenses: markPlanned(expenses),
    savings:  markPlanned(savings),
  };

  return (
    <DashboardClient
      year={year}
      month={month}
      todayYm={todayYm}
      initialData={initialData}
      wasNew={wasNew}
    />
  );
}
