import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function getRequiredSession() {
  const session = await auth();
  if (!session?.accessToken) {
    return { session: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { session, error: null };
}
