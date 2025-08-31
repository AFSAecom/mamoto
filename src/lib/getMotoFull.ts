import { supabase } from './supabaseClient';

export type MotoFull = {
  moto: { id: string; brand: string; model: string; year: number; price?: number | null; display_image?: string | null } | null;
  specs: { group: string; items: { key: string; label: string; unit: string | null; value_text?: string | null; value_number?: number | null; value_boolean?: boolean | null; value_json?: any }[] }[];
};

export async function getMotoFull(motoId: string): Promise<MotoFull> {
  const { data, error } = await supabase
    .rpc('fn_get_moto_full', { p_moto_id: motoId });

  if (error) throw error;
  return (data as MotoFull) ?? { moto: null, specs: [] };
}
