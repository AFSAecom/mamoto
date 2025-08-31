import Image from 'next/image';
import { getMotoFull } from '@/lib/getMotoFull';

export default async function MotoPage({ params }: { params: { id: string } }) {
  const fiche = await getMotoFull(params.id);

  const moto = fiche?.moto;
  if (!moto) {
    return <div className="p-6">Moto introuvable.</div>;
  }

  const images = fiche.images ?? [];
  const specs = fiche.specs ?? [];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <header className="flex items-center gap-4">
        {moto.display_image ? (
          <Image
            src={moto.display_image}
            alt={`${moto.brand} ${moto.model}`}
            width={220}
            height={140}
          />
        ) : null}
        <div>
          <h1 className="text-2xl font-semibold">
            {moto.brand} {moto.model} {moto.year}
          </h1>
          {typeof moto.price === 'number' ? (
            <p className="opacity-70">{moto.price} TND</p>
          ) : null}
        </div>
      </header>

      {images.length ? (
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img) => (
            <Image
              key={img.id}
              src={img.url}
              alt={img.alt ?? `${moto.brand} ${moto.model}`}
              width={400}
              height={300}
              className="w-full h-auto object-cover rounded"
            />
          ))}
        </section>
      ) : null}

      <section className="space-y-6">
        {specs.map((grp) => (
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
                  (it.value_json ? JSON.stringify(it.value_json) : '');
                const val = [raw, it.unit].filter(Boolean).join(' ');
                return (
                  <div key={it.key + idx} className="flex justify-between gap-4 border-b py-2">
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
