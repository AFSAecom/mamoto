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
  const { data, error } = await supabase.rpc('fn_get_moto_full', {
    p_moto_id: motoId,
  })
  if (error) throw error
  if (!data) return null

  // L'RPC peut renvoyer un objet imbriqué { moto: {...}, specs: [...] }
  // ou un objet plat directement exploitable. On normalise ici pour que la
  // page détail reçoive toujours {brand, model, year, price_tnd, images, specs}.
  let payload: any = data

  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload)
    } catch {
      payload = null
    }
  }

  if (Array.isArray(payload)) {
    payload = payload[0] ?? null
  }

  if (!payload) return null

  const moto = 'moto' in payload ? payload.moto : payload

  return {
    ...moto,
    price_tnd: moto.price_tnd ?? moto.price ?? null,
    images: payload.images ?? moto.images ?? [],
    specs: payload.specs ?? payload.groups ?? [],
  }
}

export function formatTND(v?: number | null) {
  if (v == null) return ''
  return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(v)
}
