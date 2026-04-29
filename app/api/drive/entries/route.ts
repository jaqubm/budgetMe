import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getEntries, initMonth } from '@/lib/google-drive';
import type { Category } from '@/lib/types';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken || session.error === 'RefreshTokenError') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const year     = searchParams.get('year') ?? '';
  const month    = searchParams.get('month') ?? '';
  const category = searchParams.get('category') as Category;

  if (!year || !month || !category) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const wasNew = await initMonth(session.accessToken, year, month);
  const entries = await getEntries(session.accessToken, year, month, category);
  return NextResponse.json({ entries, wasNew });
}
