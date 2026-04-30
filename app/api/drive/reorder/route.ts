import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { reorderEntries } from '@/lib/google-drive';
import type { Category } from '@/lib/types';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken || session.error === 'RefreshTokenError') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { year, month, category, fromIndex, toIndex } = await req.json() as {
    year: string; month: string; category: Category; fromIndex: number; toIndex: number;
  };

  await reorderEntries(session.accessToken, year, month, category, fromIndex, toIndex);
  return NextResponse.json({ ok: true });
}
