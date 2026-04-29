import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { setStartBalance } from '@/lib/google-drive';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken || session.error === 'RefreshTokenError') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { year, month, amount } = await req.json() as {
    year: string; month: string; amount: number;
  };

  if (!year || !month || typeof amount !== 'number') {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  await setStartBalance(session.accessToken, year, month, amount);
  return NextResponse.json({ ok: true });
}
