import Link from 'next/link';
import Image from 'next/image';
import { supabaseServer } from '@/lib/supabase/server';

export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

type MotoPub = {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  price: number | null;            // numeric
  slug: string | null;
  display_image: string | null;    // image URL à afficher
};

function moneyTND(n?: number | null) {
  if (n == null) return '';
  try {
    return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', maximumFractionDigits: 0 }).format(n);
  } catch { return `${n} TND`; }
}

export default async function MotosPage() {
  const supabase = supabaseServer();
  const { data: motos, error } = await supabase
    .from('motos_public')
    .select('id, brand, model, year, price, slug, display_image')
    .order('brand', { ascending: true })
    .order('model', { ascending: true });

  if (error) console.error('Erreur lecture motos_public:', error);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Motos neuves</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {(motos ?? []).map(m => (
          <Link key={m.id} href={`/motos/${m.id}`} className="rounded-xl border p-3 hover:shadow">
            <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden mb-2">
              {m.display_image ? (
                // @ts-expect-error Next/Image runtime
                <Image src={m.display_image} alt={`${m.brand} ${m.model}`} fill className="object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-xs text-gray-500">Pas d’image</div>
              )}
            </div>
            <div className="text-sm font-semibold">{m.brand} {m.model}</div>
            <div className="text-xs text-gray-600">
              {m.year ? `${m.year} • ` : ''}{m.price ? moneyTND(Number(m.price)) : ''}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

