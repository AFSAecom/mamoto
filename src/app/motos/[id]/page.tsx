import Image from 'next/image';
import { getMotoFull } from '@/lib/getMotoFull';

export default async function MotoPage({ params }: { params: { id: string } }) {
  const fiche = await getMotoFull(params.id);

  if (!fiche?.moto) {
    return <div className="p-6">Moto introuvable.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <header className="flex items-center gap-4">
        {fiche.moto.display_image ? (
          <Image
            src={fiche.moto.display_image}
            alt={`${fiche.moto.brand} ${fiche.moto.model}`}
            width={220}
            height={140}
            unoptimized
          />
        ) : null}
        <div>
          <h1 className="text-2xl font-semibold">
            {fiche.moto.brand} {fiche.moto.model} {fiche.moto.year}
          </h1>
          {typeof fiche.moto.price === 'number' ? (
            <p className="opacity-70">{fiche.moto.price} TND</p>
          ) : null}
        </div>
      </header>

      <section className="space-y-6">
        {fiche.specs?.map((grp) => (
          <div key={grp.group} className="rounded-2xl border p-4">
            <h2 className="text-lg font-medium mb-3">{grp.group}</h2>
            {(!grp.items || grp.items.length === 0) ? (
              <div className="opacity-60">Aucune donnée</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {grp.items.map((it, idx) => (
                  <div key={it.key + idx} className="flex justify-between gap-4 border-b py-2">
                    <span className="opacity-70">{it.label}</span>
                    <span className="font-medium">{it.value_pretty ?? ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
