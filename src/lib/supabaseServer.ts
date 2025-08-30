import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export function getSupabaseServer() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies }
  );
}

export async function requireAdmin() {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, redirectTo: '/login' as const };

  const { data: isAdmin, error } = await supabase.rpc('is_admin');
  if (error || !isAdmin) return { ok: false as const, redirectTo: '/' as const };

  return { ok: true as const, user, supabase };
}
