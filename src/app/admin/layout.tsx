import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const res = await requireAdmin();
  if (!res.ok) redirect(res.redirectTo);
  return <section>{children}</section>;
}
