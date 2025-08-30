import { supabase } from '@/lib/supabaseClient';
import type { MotoCard, MotoFull } from '@/types/supabase';

export async function fetchMotoCards(): Promise<MotoCard[]> {
  const { data, error } = await supabase
    .from('v_moto_cards')
    .select('*')
    .order('year', { ascending: false })
    .limit(2000);
  if (error) throw error;
  return (data as MotoCard[]) ?? [];
}

export async function fetchMotoFull(id: string): Promise<MotoFull | null> {
  const { data, error } = await supabase
    .rpc('fn_get_moto_full', { p_moto_id: id });
  if (error) throw error;
  return data as MotoFull | null;
}
