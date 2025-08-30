import { supabase } from '@/lib/supabaseClient';

export type MotoCard = {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  price: number | null;
  image_path: string | null;
  slug: string | null;
};

export async function fetchMotoCards(): Promise<MotoCard[]> {
  const { data, error } = await supabase
    .from('v_moto_cards')
    .select('*')
    .order('year', { ascending: false })
    .limit(2000);
  if (error) throw error;
  return data ?? [];
}

export type MotoImage = {
  path: string | null;
  alt: string | null;
  is_primary: boolean | null;
  sort_order: number | null;
};

export type MotoFull = {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  price: number | null;
  images?: MotoImage[];
  groups?: { group: string; items: { key: string; value: string | null; unit?: string | null }[] }[];
};

async function fetchMotoFullById(id: string): Promise<MotoFull | null> {
  const { data, error } = await supabase.rpc('fn_get_moto_full', { p_moto_id: id });
  if (error) throw error;
  return (data as MotoFull) ?? null;
}

export async function resolveIdFromSlug(slug: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('motos')
    .select('id')
    .eq('slug', slug)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export async function fetchMotoFullBySlugOrId(identifier: string): Promise<MotoFull | null> {
  // Si l’identifiant ressemble à un UUID, tente direct.
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const id = uuidRegex.test(identifier) ? identifier : (await resolveIdFromSlug(identifier));
  if (!id) return null;
  return fetchMotoFullById(id);
}
