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

function isUuid(x: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x);
}

export async function resolveIdFromSlug(identifier: string): Promise<string | null> {
  if (isUuid(identifier)) return identifier;
  const { data, error } = await supabase
    .from('motos')
    .select('id')
    .eq('slug', identifier)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

// Normalise le retour RPC (objet direct, string JSON, array[objet])
function normalizeRpcResult(raw: any): MotoFull | null {
  if (!raw) return null;
  let obj = raw;
  if (typeof raw === 'string') {
    try { obj = JSON.parse(raw); } catch {}
  }
  if (Array.isArray(obj)) {
    obj = obj[0] ?? null;
  }
  return obj as MotoFull | null;
}

// Tente p_moto_id (uuid), sinon p_moto_id_text (texte)
async function callMotoFullRpc(id: string): Promise<MotoFull | null> {
  // 1) p_moto_id
  let { data, error } = await supabase.rpc('fn_get_moto_full', { p_moto_id: id });
  if (!error && data) {
    return normalizeRpcResult(data);
  }
  // 2) p_moto_id_text
  ({ data, error } = await supabase.rpc('fn_get_moto_full', { p_moto_id_text: id }));
  if (!error && data) {
    return normalizeRpcResult(data);
  }
  // 3) certains environnements renvoient null sans error → dernier essai: p_moto_id en texte
  ({ data, error } = await supabase.rpc('fn_get_moto_full', { p_moto_id: String(id) }));
  if (!error && data) {
    return normalizeRpcResult(data);
  }
  // remonter la dernière erreur si dispo
  if (error) throw error;
  return null;
}

export async function fetchMotoFullBySlugOrId(identifier: string): Promise<MotoFull | null> {
  const id = await resolveIdFromSlug(identifier);
  if (!id) return null;
  const payload = await callMotoFullRpc(id);
  if (!payload) return null;

  // tri images côté client
  const images = (payload.images ?? []).slice().sort(
    (a, b) =>
      (Number(b.is_primary) - Number(a.is_primary)) ||
      ((a.sort_order ?? 0) - (b.sort_order ?? 0))
  );
  return { ...payload, images };
}

