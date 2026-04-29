import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { addEntry, updateEntry, patchEntry, deleteEntry } from '@/lib/google-drive';
import type { Category, Entry } from '@/lib/types';

async function getSession() {
  const session = await auth();
  if (!session?.accessToken) return null;
  return session;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { year, month, category, ...entry } = body as {
    year: string; month: string; category: Category;
  } & Entry;

  await addEntry(session.accessToken, year, month, category, entry);
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { year, month, category, index, ...entry } = body as {
    year: string; month: string; category: Category; index: number;
  } & Entry;

  await updateEntry(session.accessToken, year, month, category, index, entry);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    year: string; month: string; category: Category; index: number;
    constant?: boolean; planned?: boolean; plannedAmount?: number; amount?: number;
  };
  const { year, month, category, index, ...patch } = body;

  await patchEntry(session.accessToken, year, month, category, index, patch);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    year: string; month: string; category: Category; index: number;
  };
  await deleteEntry(session.accessToken, body.year, body.month, body.category, body.index);
  return NextResponse.json({ ok: true });
}
