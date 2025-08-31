import Image from 'next/image';
import { getMotoFull } from '@/lib/getMotoFull';

export default async function MotoPage({ params }: { params: { id: string } }) {
  const fiche = await getMotoFull(params.id);

  if (!fiche?.moto) {
    return <div className="p-6">Moto introuvable.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">
          {fiche.moto.brand_name} {fiche.moto.model_name} {fiche.moto.year}
        </h1>
        <p className="opacity-70">
          {typeof fiche.moto.price_tnd === 'number'
            ? `${fiche.moto.price_tnd} TND`
            : '-'}
        </p>
      </header>

      {fiche.images.length > 0 && (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fiche.images.map((img) => (
            <Image
              key={img.id}
              src={img.image_url}
              alt={img.alt ?? ''}
              width={800}
              height={600}
              className="w-full h-auto rounded"
            />
          ))}
        </section>
      )}

      <section className="space-y-6">
        {fiche.specs?.map((grp) => (
          <div key={grp.group} className="rounded-2xl border p-4">
            <h2 className="text-lg font-medium mb-3">{grp.group}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {grp.items?.map((it, idx) => {
                const raw =
                  it.value_text ??
                  it.value_number ??
                  (typeof it.value_boolean === 'boolean'
                    ? it.value_boolean
                      ? 'Oui'
                      : 'Non'
                    : null) ??
                  (it.value_json ? JSON.stringify(it.value_json) : null);
                const val = raw ? [raw, it.unit].filter(Boolean).join(' ') : '-';
                return (
                  <div
                    key={it.key + idx}
                    className="flex justify-between gap-4 border-b py-2"
                  >
                    <span className="opacity-70">{it.label}</span>
                    <span className="font-medium">{val}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
