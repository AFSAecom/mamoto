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

    const { data, error } = await s
      .from('motos')
      .select('brand, marque, make');
    if (error) throw error;

    const set = new Set<string>();
    (data ?? []).forEach((r: any) => {
      const b = r?.brand ?? r?.marque ?? r?.make;
      if (b) set.add(String(b));
    });

    const brands = Array.from(set).sort((a, b) => a.localeCompare(b));
    return NextResponse.json({ brands });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? 'Unexpected error' }, { status: 500 });
  }
}
