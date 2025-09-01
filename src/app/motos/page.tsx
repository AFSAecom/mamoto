import Filters from '@/components/motos/Filters'
import MotoCard from '@/components/MotoCard'
import { supabaseServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function isUUIDv4(x: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x)
}

function parseNumber(v: string | string[] | undefined) {
  if (typeof v !== 'string') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

export default async function MotosPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const brand_id =
    typeof searchParams.brand_id === 'string' && isUUIDv4(searchParams.brand_id)
      ? searchParams.brand_id
      : undefined
  const year_min = parseNumber(searchParams.year_min)
  const year_max = parseNumber(searchParams.year_max)
  const price_min = parseNumber(searchParams.price_min)
  const price_max = parseNumber(searchParams.price_max)
  const qRaw = typeof searchParams.q === 'string' ? searchParams.q.trim() : ''
  const q = qRaw ? qRaw : undefined

  const supabase = supabaseServer()

  let query = supabase
    .from('motos')
    .select('id,brand_name,model_name,year,price_tnd,primary_image_path')
    .order('year', { ascending: false })

  if (brand_id) query = query.eq('brand_id', brand_id)
  if (year_min != null) query = query.gte('year', year_min)
  if (year_max != null) query = query.lte('year', year_max)
  if (price_min != null) query = query.gte('price_tnd', price_min)
  if (price_max != null) query = query.lte('price_tnd', price_max)
  if (q) query = query.or(`brand_name.ilike.%${q}%,model_name.ilike.%${q}%`)

  const { data: motos, error } = await query
  if (error && process.env.NODE_ENV !== 'production') {
    console.error('motos query error', error)
  }

  const { data: brands } = await supabase
    .from('brands')
    .select('id,name')
    .order('name', { ascending: true })

  return (
    <div className="p-4 space-y-4">
      <Filters brands={brands || []} />
      {error ? (
        <div className="text-red-600">Impossible de charger les motos.</div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {(motos || []).map(m => (
            <MotoCard key={m.id} moto={m} />
          ))}
        </div>
      )}
    </div>
  )
}

