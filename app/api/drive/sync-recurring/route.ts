import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { syncRecurring } from '@/lib/google-drive';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken || session.error === 'RefreshTokenError') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { year, month } = await req.json() as { year: string; month: string };
  if (!year || !month) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  const { added } = await syncRecurring(session.accessToken, year, month);
  return NextResponse.json({ added });
}
