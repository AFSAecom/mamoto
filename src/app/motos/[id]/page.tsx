import type { Metadata } from 'next';
import Image from 'next/image';
import { fetchMotoFullBySlugOrId, type MotoFull } from '@/services/motos';
import { publicImageUrl } from '@/lib/storage';

export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const dynamicParams = true;

type Params = { params: { id: string } };

function formatPrice(n?: number | null) {
  if (n == null) return '';
  try {
    return new Intl.NumberFormat('fr-TN').format(n) + ' TND';
  } catch {
    return `${n} TND`;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const data = await fetchMotoFullBySlugOrId(params.id).catch(() => null);
  const title = data ? `${data.brand} ${data.model} | moto.tn` : 'Fiche moto | moto.tn';
  return { title };
}

export default async function MotoPage({ params }: Params) {
  let data: MotoFull | null = null;
  try {
    data = await fetchMotoFullBySlugOrId(params.id);
  } catch (error) {
    console.error('Erreur fn_get_moto_full:', error);
  }
  console.debug('[moto] detail', !!data);

  if (!data) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold">Fiche indisponible</h1>
        <p className="mt-2 text-muted-foreground">La moto demandée n’existe pas ou a été supprimée.</p>
      </div>
    );
  }

  const moto = data as MotoFull;
  const images = (moto.images ?? []).sort(
    (a: any, b: any) =>
      (Number(b.is_primary) - Number(a.is_primary)) ||
      ((a.sort_order ?? 0) - (b.sort_order ?? 0))
  );
  const groups = moto.groups ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{moto.brand} {moto.model}</h1>
        {moto.year && <p className="text-sm text-muted-foreground">{moto.year}</p>}
        {moto.price != null && (
          <p className="text-sm font-medium">{formatPrice(Number(moto.price))}</p>
        )}
      </div>

      {publicImageUrl(images[0]?.path) && (
        <div className="relative w-full max-w-3xl aspect-video bg-gray-100 rounded-xl overflow-hidden mb-6">
          <Image
            src={publicImageUrl(images[0].path)!}
            alt={images[0].alt ?? `${moto.brand} ${moto.model}`}
            fill
            className="object-contain"
          />
        </div>
      )}

      {images.length > 1 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {images.map((img: any, idx: number) => (
            <div key={idx} className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {publicImageUrl(img.path) && (
                <Image
                  src={publicImageUrl(img.path)!}
                  alt={img.alt ?? `${moto.brand} ${moto.model}`}
                  fill
                  className="object-cover"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {groups.length > 0 ? (
        groups.map((g: any) => (
          <div key={g.group} className="mb-6">
            <h2 className="text-xl font-semibold mb-3">{g.group}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(g.items ?? [])
                .filter((it: any) => it.value)
                .map((it: any, idx: number) => (
                  <div key={idx} className="rounded-lg border p-3">
                    <div className="text-sm font-medium">{it.key}</div>
                    <div className="text-sm text-muted-foreground">
                      {it.value}
                      {it.unit ? ` ${it.unit}` : ''}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))
      ) : (
        <div className="text-sm text-muted-foreground">Aucune spécification</div>
      )}
    </div>
  );
}
