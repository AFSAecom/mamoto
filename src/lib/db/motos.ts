import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export type MotoCard = {
  id: string
  brand: string | null
  model: string | null
  year: number | null
  price_tnd: number | null
  primary_image_path: string | null
}

export async function fetchMotoCards(limit = 24): Promise<MotoCard[]> {
  const { data, error } = await supabase
    .from('v_moto_cards')
    .select('*')
    .order('year', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as MotoCard[]
}

export async function fetchMotoFull(motoId: string): Promise<any> {
  const { data, error } = await supabase
    .rpc('fn_get_moto_full', { p_moto_id: motoId })
  if (error) throw error
  return data // JSON complet (brand, model, price_tnd, images[], specs[])
}

export function formatTND(v?: number | null) {
  if (v == null) return ''
  return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(v)
}
