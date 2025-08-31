import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
}

export type MotoCard = {
  id: string; brand: string|null; model: string|null; year: number|null; price: number|null;
  slug: string|null; display_image: string|null;
};

export async function getPublishedMotos(): Promise<MotoCard[]> {
  const s = supabaseServer();
  const { data } = await s.from('motos_public')
    .select('id,brand,model,year,price,slug,display_image')
    .order('id', { ascending: false });
  return data ?? [];
}

export type MotoSpec = {
  id: string; category: string|null; subcategory: string|null;
  key_name: string; value_text: string; unit: string|null; sort_order: number|null;
};

export async function getMotoFullByIdentifier(identifier: string) {
  const s = supabaseServer();
  const isUuid = /^[0-9a-f-]{36}$/i.test(identifier);

  const baseSel = 'id,brand,model,year,price,slug,main_image_url,is_published';
  const { data: moto } = isUuid
    ? await s.from('motos').select(baseSel).eq('id', identifier).single()
    : await s.from('motos').select(baseSel).eq('slug', identifier).single();
  if (!moto || moto.is_published !== true) return null;

  const { data: images } = await s.from('moto_images')
    .select('id,image_url,alt,is_main,created_at')
    .eq('moto_id', moto.id)
    .order('is_main', { ascending: false })
    .order('created_at', { ascending: false });

  const { data: specsRaw } = await s.from('moto_specs')
    .select('id,category,subcategory,key_name,value_text,unit,sort_order')
    .eq('moto_id', moto.id)
    .order('sort_order', { ascending: true })
    .order('key_name', { ascending: true });

  // Filtrer les lignes vides (value_text TRIM = '')
  const specs = (specsRaw ?? []).filter(sp => (sp.value_text ?? '').trim().length > 0);

  return { moto, images: images ?? [], specs };
}

