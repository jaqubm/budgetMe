import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { initAndGetMonth } from '@/lib/google-drive';
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

  const result = await initAndGetMonth(session.accessToken, year, month);
  return NextResponse.json({ entries: result[category], wasNew: result.wasNew });
}
