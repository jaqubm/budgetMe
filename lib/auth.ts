import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';

export async function getRequiredSession() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return { session: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { session, error: null };
}
