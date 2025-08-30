import Image from 'next/image';
import { getMotoFull } from '@/lib/public/motos';

export default async function MotoDetail({ params }: { params: { id: string } }) {
  const res = await getMotoFull(params.id);
  if (!res) return <main className="p-6">Introuvable ou non publiée.</main>;

  const { moto, images, specs } = res;
  const hero = moto.main_image_url
    || images.find(i => i.is_main)?.image_url
    || images[0]?.image_url
    || null;

  // Regroupement simple Catégorie -> Sous-catégorie -> Specs
  const groups = new Map<string, Map<string, typeof specs>>();
  for (const sp of specs) {
    const cat = sp.category || 'Général';
    const sub = sp.subcategory || '';
    if (!groups.has(cat)) groups.set(cat, new Map());
    const subMap = groups.get(cat)!;
    if (!subMap.has(sub)) subMap.set(sub, []);
    subMap.get(sub)!.push(sp);
  }

  return (
    <main className="p-6 space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{moto.brand} {moto.model}</h1>
        <p className="text-sm opacity-70">{moto.year ?? ''} {moto.price ? `• ${moto.price} TND` : ''}</p>
      </header>

      <section className="aspect-[16/10] bg-black/10 relative rounded overflow-hidden">
        {hero
          ? <Image src={hero} alt={`${moto.brand||''} ${moto.model||''}`} fill sizes="100vw" className="object-cover" />
          : <div className="w-full h-full grid place-items-center text-sm text-white/60">Pas d’image</div>}
      </section>

      {images.length > 1 && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {images.map(im => (
            <div key={im.id} className="relative aspect-[4/3] rounded overflow-hidden">
              <Image src={im.image_url} alt={im.alt||''} fill sizes="25vw" className="object-cover" />
            </div>
          ))}
        </section>
      )}

      <section>
        <h2 className="text-xl font-semibold mb-3">Fiche technique</h2>
        {!specs.length && <p className="opacity-70">Aucune caractéristique pour le moment.</p>}
        <div className="space-y-6">
          {Array.from(groups.entries()).map(([cat, subMap]) => (
            <div key={cat} className="space-y-3">
              <h3 className="font-medium text-lg">{cat}</h3>
              {Array.from(subMap.entries()).map(([sub, list]) => (
                <div key={cat + '//' + sub} className="border rounded">
                  {sub && <div className="px-3 py-2 text-sm font-medium bg-black/5">{sub}</div>}
                  <table className="w-full text-sm">
                    <tbody>
                      {list.map(sp => (
                        <tr key={sp.id} className="border-t">
                          <td className="px-3 py-2 w-1/2">{sp.key_name}</td>
                          <td className="px-3 py-2 w-1/2">
                            {sp.value_text}{sp.unit ? ` ${sp.unit}` : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

