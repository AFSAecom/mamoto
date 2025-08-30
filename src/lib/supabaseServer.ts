import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export function getSupabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options?: CookieOptions) {
          cookieStore.set(name, value, options);
        },
        remove(name: string, options?: CookieOptions) {
          cookieStore.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );
}

export async function requireAdmin() {
  const supabase = getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, redirectTo: '/login' as const };

  // Vérif RPC
  let isAdmin = false;
  const { data: rpcData } = await supabase.rpc('is_admin');
  if (rpcData === true) isAdmin = true;

  // Fallback table admins
  if (!isAdmin) {
    const { data: rows } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .limit(1);
    if ((rows?.length ?? 0) > 0) isAdmin = true;
  }

  if (!isAdmin) return { ok: false as const, redirectTo: '/' as const };
  return { ok: true as const, user, supabase };
}
