import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { setEntries } from '@/lib/google-drive';
import type { Category, Entry } from '@/lib/types';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { year, month, category, entries, groupOrder } = await req.json() as {
    year: string;
    month: string;
    category: Category;
    entries: Entry[];
    groupOrder?: string[];
  };

  await setEntries(session.accessToken, year, month, category, entries, groupOrder);
  return NextResponse.json({ ok: true });
}
