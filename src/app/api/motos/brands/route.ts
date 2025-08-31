import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = cookies();
    const s = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );

    // Use RPC to avoid RLS/column name issues
    const { data, error } = await s.rpc('fn_public_brands');
    if (error) throw error;

    const brands: string[] = Array.isArray(data) ? data.filter(Boolean) : [];
    return NextResponse.json({ brands });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? 'Unexpected error' }, { status: 500 });
  }
}

