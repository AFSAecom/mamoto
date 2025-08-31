// RPC-based comparator endpoint for motos
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { ids = [] } = (await req.json().catch(() => ({ ids: [] }))) as {
      ids?: string[];
    };

    if (!Array.isArray(ids)) {
      return NextResponse.json({ error: 'ids must be an array' }, { status: 400 });
    }
    if (ids.length > 4) {
      return NextResponse.json({ error: 'Maximum 4 motos' }, { status: 400 });
    }

    const cookieStore = cookies();
    const s = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );

    const { data, error } = await s.rpc('fn_get_comparator', { p_moto_ids: ids });
    if (error) {
      console.error('RPC error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, payload: data ?? null });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? 'Unexpected error' }, { status: 500 });
  }
}
