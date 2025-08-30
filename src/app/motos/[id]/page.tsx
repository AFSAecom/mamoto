import Image from 'next/image';
import { getMotoWithImages } from '@/lib/public/motos';

export default async function MotoDetail({ params }: { params: { id: string } }) {
  const res = await getMotoWithImages(params.id);
  if (!res) return <main className="p-6">Introuvable ou non publiée.</main>;
  const { moto, images } = res;
  const hero = moto.main_image_url || images.find(i=>i.is_main)?.image_url || images[0]?.image_url || null;

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">{moto.brand} {moto.model}</h1>

      <div className="aspect-[16/10] bg-black/10 relative rounded overflow-hidden">
        {hero
          ? <Image src={hero} alt={`${moto.brand||''} ${moto.model||''}`} fill sizes="100vw" className="object-cover" />
          : <div className="w-full h-full grid place-items-center text-sm text-white/60">Pas d’image</div>}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {images.map(im => (
            <div key={im.id} className="relative aspect-[4/3] rounded overflow-hidden">
              <Image src={im.image_url} alt={im.alt||''} fill sizes="25vw" className="object-cover" />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
