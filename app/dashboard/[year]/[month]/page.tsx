import { redirect } from 'next/navigation';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getEntries, initMonth } from '@/lib/google-drive';
import type { MonthData } from '@/lib/types';
import { DashboardClient } from './DashboardClient';

interface Props {
  params: Promise<{ year: string; month: string }>;
}

export default async function DashboardPage({ params }: Props) {
  const { year, month } = await params;
  const session = await auth();
  if (!session?.accessToken) redirect('/sign-in');

  const wasNew = await initMonth(session.accessToken, year, month);

  const now = new Date();
  const todayYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const ym = `${year}-${month}`;
  const isFutureMth = ym > todayYm;

  const [income, expenses, savings] = await Promise.all([
    getEntries(session.accessToken, year, month, 'income'),
    getEntries(session.accessToken, year, month, 'expenses'),
    getEntries(session.accessToken, year, month, 'savings'),
  ]);

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
