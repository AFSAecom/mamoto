import MotoCard from '@/components/MotoCard';
import Filters from '@/components/motos/Filters';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

function parseNumber(value: string | string[] | undefined): number | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : undefined;
}

function parseString(value: string | string[] | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export default async function MotosPage({ searchParams }: PageProps) {
  const filters = {
    brandId: parseString(searchParams.brandId),
    model: parseString(searchParams.model),
    yearMin: parseNumber(searchParams.yearMin),
    yearMax: parseNumber(searchParams.yearMax),
    priceMin: parseNumber(searchParams.priceMin),
    priceMax: parseNumber(searchParams.priceMax),
  };

  const supabase = supabaseServer();

  let query = supabase
    .from('motos_public')
    .select('id,brand,model,year,price,slug,display_image,brand_id')
    .order('year', { ascending: false });

  if (filters.brandId) {
    query = query.eq('brand_id', filters.brandId);
  }
  if (filters.model) {
    query = query.ilike('model', `%${filters.model}%`);
  }
  if (filters.yearMin !== undefined) {
    query = query.gte('year', filters.yearMin);
  }
  if (filters.yearMax !== undefined) {
    query = query.lte('year', filters.yearMax);
  }
  if (filters.priceMin !== undefined) {
    query = query.gte('price', filters.priceMin);
  }
  if (filters.priceMax !== undefined) {
    query = query.lte('price', filters.priceMax);
  }

  const { data: motos } = await query;
  const { data: brands } = await supabase
    .from('brands')
    .select('id,name')
    .order('name', { ascending: true });

  return (
    <div className="space-y-6 p-4">
      <Filters brands={brands ?? []} />
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {motos?.map(moto => (
          <MotoCard key={moto.id} moto={moto} />
        ))}
      </div>
    </div>
  );
}

