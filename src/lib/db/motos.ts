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
  // si ce n'est pas un uuid, tenter de résoudre l'id via le slug
  const isUuid = (v: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)

  const resolveId = async (identifier: string) => {
    if (isUuid(identifier)) return identifier
    const { data, error } = await supabase
      .from('motos')
      .select('id')
      .eq('slug', identifier)
      .limit(1)
      .maybeSingle()
    if (error) return null
    return data?.id ?? null
  }

  // normalise les différents formats renvoyés par l'RPC
  const normalize = (raw: any) => {
    if (!raw) return null
    let obj = raw
    if (typeof obj === 'string') {
      try {
        obj = JSON.parse(obj)
      } catch {
        return null
      }
    }
    if (Array.isArray(obj)) {
      obj = obj[0] ?? null
    }
    return obj
  }

  // tente d'appeler l'RPC avec p_moto_id (uuid) puis p_moto_id_text (texte)
  const tryCall = async (params: Record<string, any>) => {
    const { data, error } = await supabase.rpc('fn_get_moto_full', params)
    if (error || !data) return null
    return normalize(data)
  }

  const resolvedId = await resolveId(motoId)
  const idOrSlug = resolvedId ?? motoId

  let payload =
    (await tryCall({ p_moto_id: idOrSlug })) ??
    (await tryCall({ p_moto_id_text: idOrSlug }))

  if (!payload && resolvedId && resolvedId !== motoId) {
    payload = await tryCall({ p_moto_id_text: motoId })
  }

  if (!payload) return null

  const moto = 'moto' in payload ? payload.moto : payload
  const images = (payload.images ?? moto.images ?? []).slice().sort(
    (a: any, b: any) =>
      Number(b.is_primary) - Number(a.is_primary) ||
      ((a.sort_order ?? 0) - (b.sort_order ?? 0))
  )

  return {
    ...moto,
    price_tnd: moto.price_tnd ?? moto.price ?? null,
    images,
    specs: payload.specs ?? payload.groups ?? [],
  }
}

export function formatTND(v?: number | null) {
  if (v == null) return ''
  return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(v)
}
