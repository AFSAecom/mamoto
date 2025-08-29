export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getSession, isAdmin } from '@/lib/supabaseServer';
import AdminNav from '@/components/admin/AdminNav';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getSession();
  const ok = user && await isAdmin();
  if (!ok) redirect('/');
  return (
    <section className="p-6">
      <AdminNav />
      {children}
    </section>
  );
}
