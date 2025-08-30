import Link from 'next/link';
import Image from 'next/image';
import { fetchMotoCards, type MotoCard } from '@/services/motos';
import { publicImageUrl } from '@/lib/storage';

export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

function moneyTND(n?: number | null) {
  if (n == null) return '';
  try {
    return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', maximumFractionDigits: 0 }).format(n);
  } catch { return `${n} TND`; }
}

export default async function MotosPage() {
  let motos: MotoCard[] = [];
  let errored = false;
  try {
    motos = await fetchMotoCards();
  } catch (error) {
    console.error('Erreur lecture v_moto_cards:', error);
    errored = true;
  }
  console.debug('[moto] rows', motos.length);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Motos neuves</h1>
      {errored && <p className="mb-4 text-sm text-red-500">Erreur de chargement.</p>}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {motos.length === 0 && !errored && (
          <div className="col-span-full text-center text-sm text-muted-foreground">Aucune moto trouvée</div>
        )}
        {motos.map(m => (
          <Link key={m.id} href={`/motos/${m.id}`} className="rounded-xl border p-3 hover:shadow">
            <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden mb-2">
              {publicImageUrl(m.image_path) ? (
                <Image src={publicImageUrl(m.image_path)!} alt={`${m.brand} ${m.model}`} fill className="object-cover" />
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

