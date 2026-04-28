import { redirect } from 'next/navigation';
import { auth } from '@/app/api/auth/[...nextauth]/route';

export default async function Home() {
  const session = await auth();
  if (!session) redirect('/sign-in');

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  redirect(`/dashboard/${year}/${month}`);
}
