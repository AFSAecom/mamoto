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

export type MotoGroupItem = {
  key: string;
  value: string | null;
  unit?: string | null;
};

export type MotoGroup = {
  group: string;
  items: MotoGroupItem[];
};

export type MotoFull = {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  price: number | null;
  images?: MotoImage[];
  groups?: MotoGroup[];
};

const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function resolveIdFromSlug(identifier: string): Promise<string | null> {
  if (uuidRe.test(identifier)) return identifier;
  const { data, error } = await supabase
    .from('motos')
    .select('id')
    .eq('slug', identifier)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

// normalise: objet direct | string JSON | array[objet]
function normalizeRpcResult(raw: any): MotoFull | null {
  if (!raw) return null;
  let obj = raw;
  if (typeof raw === 'string') {
    try { obj = JSON.parse(raw); } catch {}
  }
  if (Array.isArray(obj)) obj = obj[0] ?? null;
  return obj as MotoFull | null;
}

// tente successivement p_moto_id → p_moto_id_text → p_moto_id as string
async function callMotoFullRpc(id: string): Promise<MotoFull | null> {
  let r = await supabase.rpc('fn_get_moto_full', { p_moto_id: id });
  if (!r.error && r.data) return normalizeRpcResult(r.data);

  r = await supabase.rpc('fn_get_moto_full', { p_moto_id_text: id });
  if (!r.error && r.data) return normalizeRpcResult(r.data);

  r = await supabase.rpc('fn_get_moto_full', { p_moto_id: String(id) });
  if (!r.error && r.data) return normalizeRpcResult(r.data);

  if (r.error) throw r.error;
  return null;
}

export async function fetchMotoFullBySlugOrId(identifier: string): Promise<MotoFull | null> {
  const id = await resolveIdFromSlug(identifier);
  if (!id) return null;
  const payload = await callMotoFullRpc(id);
  if (!payload) return null;
  const images = (payload.images ?? []).slice().sort(
    (a, b) =>
      (Number(b.is_primary) - Number(a.is_primary)) ||
      ((a.sort_order ?? 0) - (b.sort_order ?? 0))
  );
  return { ...payload, images };
}

