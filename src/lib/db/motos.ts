import { supabase } from '@/lib/supabaseClient'

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

export async function getMotoFull(id: string): Promise<any> {
  const { data, error } = await supabase.rpc('fn_get_moto_full', {
    p_moto_id: id,
  })

  if (error) {
    console.error('getMotoFull error', error)
    throw new Error('MOTO_NOT_FOUND')
  }

  if (!data) {
    throw new Error('MOTO_NOT_FOUND')
  }

  return data
}

export function formatTND(v?: number | null) {
  if (v == null) return ''
  return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(v)
}
