import Filters from '@/components/motos/Filters'
import MotoCard from '@/components/MotoCard'
import { getSupabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

function getString(val: string | string[] | undefined): string | undefined {
  if (Array.isArray(val)) return val[0]
  return val
}

function parseNumber(
  val: string | undefined,
  parser: (v: string) => number
): number | undefined {
  if (!val) return undefined
  const n = parser(val)
  return Number.isNaN(n) ? undefined : n
}

function isUuid(v: string | undefined): v is string {
  return !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
}

export default async function MotosPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const rawBrand = getString(searchParams.brand_id)
  const rawModel = getString(searchParams.model_id)
  const rawYearMin = getString(searchParams.year_min)
  const rawYearMax = getString(searchParams.year_max)
  const rawPriceMin = getString(searchParams.price_min)
  const rawPriceMax = getString(searchParams.price_max)
  const rawQ = getString(searchParams.q)

  const filters = {
    brand_id: isUuid(rawBrand) ? rawBrand : undefined,
    model_id: isUuid(rawModel) ? rawModel : undefined,
    year_min: parseNumber(rawYearMin, parseInt),
    year_max: parseNumber(rawYearMax, parseInt),
    price_min: parseNumber(rawPriceMin, parseFloat),
    price_max: parseNumber(rawPriceMax, parseFloat),
    q: rawQ && rawQ.trim() !== '' ? rawQ : undefined,
  }

  const supabase = getSupabaseServer()

  if (process.env.NODE_ENV !== 'production') {
    console.log('filters', filters)
  }

  let query = supabase
    .from('motos')
    .select('id,brand_id,brand_name,model_name,year,price_tnd,display_image')

  if (filters.brand_id) query = query.eq('brand_id', filters.brand_id)
  if (filters.model_id) query = query.eq('model_id', filters.model_id)
  if (filters.year_min !== undefined) query = query.gte('year', filters.year_min)
  if (filters.year_max !== undefined) query = query.lte('year', filters.year_max)
  if (filters.price_min !== undefined)
    query = query.gte('price_tnd', filters.price_min)
  if (filters.price_max !== undefined)
    query = query.lte('price_tnd', filters.price_max)
  if (filters.q) {
    query = query.or(
      `model_name.ilike.%${filters.q}%,brand_name.ilike.%${filters.q}%`
    )
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('supabase query', query)
  }

  const { data: motos, error } = await query

  const { data: brands } = await supabase
    .from('brands')
    .select('id,name')
    .order('name')

  return (
    <div className="p-4 space-y-4">
      <Filters brands={brands ?? []} />
      {error ? (
        <div>Erreur de chargement</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {motos?.map(m => (
            <MotoCard key={m.id} moto={m} />
          ))}
        </div>
      )}
    </div>
  )
}

