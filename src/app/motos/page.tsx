import Link from 'next/link';
import Image from 'next/image';
import { fetchMotoCards, type MotoCard } from '@/services/motos';
import { publicImageUrl } from '@/lib/storage';

export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const fmt = (n?: number | null) => n == null ? '' : new Intl.NumberFormat('fr-TN').format(n) + ' TND';

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
        {motos.map(m => {
          const title = [m.brand, m.model, m.year ?? ''].filter(Boolean).join(' ').trim();
          return (
            <Link key={m.id} href={`/motos/${m.slug ?? m.id}`} className="rounded-xl border p-3 hover:shadow">
              <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden mb-2">
                {publicImageUrl(m.image_path) ? (
                  <Image src={publicImageUrl(m.image_path)!} alt={title} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-xs text-gray-500">Pas d’image</div>
                )}
              </div>
              <div className="text-sm font-semibold">{title}</div>
              {m.price != null && (
                <div className="text-xs text-gray-600">{fmt(m.price)}</div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

