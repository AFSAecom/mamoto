import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { brand } = (await req.json()) as { brand: string };
    if (!brand) {
      return NextResponse.json({ error: 'brand required' }, { status: 400 });
    }

    const cookieStore = cookies();
    const s = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );

    const { data, error } = await s
      .from('motos')
      .select('id, brand, marque, make, model, modele, model_name, year, price, price_tnd, display_image, image_url, cover_image, image')
      .or(`brand.eq.${brand},marque.eq.${brand},make.eq.${brand}`)
      .order('model', { ascending: true })
      .order('year', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ motos: data ?? [] });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? 'Unexpected error' }, { status: 500 });
  }
}

