import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json() as { ids: string[] };

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids required' }, { status: 400 });
    }
    if (ids.length > 4) {
      return NextResponse.json({ error: 'Maximum 4 motos' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('fn_get_comparator', {
      p_moto_ids: ids,
    });

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
