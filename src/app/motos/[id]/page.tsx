import type { Metadata } from 'next';
import { fetchMotoFullBySlugOrId, type MotoFull } from '@/services/motos';
import { publicImageUrl } from '@/lib/storage';

export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const dynamicParams = true;

type Params = { params: { id: string } };

function fmt(n?: number | null) {
  if (n == null) return '';
  try {
    return new Intl.NumberFormat('fr-TN').format(n);
  } catch {
    return String(n);
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const data = await fetchMotoFullBySlugOrId(params.id).catch(() => null);
  const title = data ? `${data.brand} ${data.model} | moto.tn` : 'Fiche moto | moto.tn';
  return { title };
}

export default async function MotoPage({ params }: Params) {
  const identifier = params.id;
  console.debug('[detail] id/slug:', identifier);
  let data: MotoFull | null = null;
  let errored = false;
  try {
    data = await fetchMotoFullBySlugOrId(identifier);
  } catch (error) {
    console.error('Erreur fn_get_moto_full:', error);
    errored = true;
  }
  console.debug('[detail] has data:', !!data);

  if (!data) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="text-sm text-muted-foreground">
          {errored ? 'Erreur de chargement' : 'Fiche indisponible'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-4">
        <h1 className="text-3xl font-bold">{data.brand} {data.model}</h1>
        <div className="text-sm text-muted-foreground">
          {data.year ?? ''} {data.price != null ? ` • ${fmt(data.price)} TND` : ''}
        </div>
      </header>

      {data.images?.length ? (
        <div className="flex gap-2 overflow-x-auto mb-6">
          {data.images.map((img, i) => {
            const src = publicImageUrl(img.path);
            if (!src) return null;
            return (
              <img
                key={i}
                src={src}
                alt={img.alt ?? `${data.brand} ${data.model}`}
                className="h-48 w-auto object-cover rounded"
              />
            );
          })}
        </div>
      ) : null}

      <section className="mt-6">
        {data.groups?.length ? (
          data.groups.map((g, gi) => (
            <div key={gi} className="mb-6">
              <h3 className="text-xl font-semibold mb-3">{g.group}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {g.items
                  ?.filter(it => it && it.value)
                  .map((it, ii) => (
                    <div key={ii} className="rounded-lg border p-3">
                      <div className="text-sm font-medium">{it.key}</div>
                      <div className="text-sm text-muted-foreground">
                        {it.value}{it.unit ? ` ${it.unit}` : ''}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground">Aucune spécification</div>
        )}
      </section>
    </div>
  );
}

