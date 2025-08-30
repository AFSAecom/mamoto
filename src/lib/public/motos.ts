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
  id: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  price: number | null;
  main_image_url: string | null;
};

export async function getPublishedMotos(): Promise<(MotoCard & { display_image: string | null })[]> {
  const s = supabaseServer();
  const { data: motos } = await s
    .from('motos')
    .select('id,brand,model,year,price,main_image_url')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (!motos?.length) return [];

  const ids = motos.map(m => m.id);
  const { data: imgs } = await s
    .from('moto_images')
    .select('moto_id,image_url,is_main,created_at')
    .in('moto_id', ids)
    .order('is_main', { ascending: false })
    .order('created_at', { ascending: false });

  const byMoto = new Map<string, string>();
  imgs?.forEach(im => { if (!byMoto.has(im.moto_id)) byMoto.set(im.moto_id, im.image_url); });

  return motos.map(m => ({
    ...m,
    display_image: m.main_image_url || byMoto.get(m.id) || null,
  }));
}

export type MotoSpec = {
  id: string;
  category: string | null;
  subcategory: string | null;
  key_name: string;
  value_text: string;
  unit: string | null;
  sort_order: number | null;
};

export async function getMotoFull(id: string) {
  const s = supabaseServer();

  const { data: moto } = await s
    .from('motos')
    .select('id,brand,model,year,price,main_image_url,is_published')
    .eq('id', id).single();
  if (!moto || moto.is_published !== true) return null;

  const { data: images } = await s
    .from('moto_images')
    .select('id,image_url,alt,is_main,created_at')
    .eq('moto_id', id)
    .order('is_main', { ascending: false })
    .order('created_at', { ascending: false });

  const { data: specs } = await s
    .from('moto_specs')
    .select('id,category,subcategory,key_name,value_text,unit,sort_order')
    .eq('moto_id', id)
    .order('sort_order', { ascending: true })
    .order('key_name', { ascending: true });

  return { moto, images: images || [], specs: specs || [] };
}

