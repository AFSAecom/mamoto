import Link from 'next/link';
import Image from 'next/image';
import { getPublishedMotos } from '@/lib/public/motos';

export const dynamic = 'force-dynamic';

export default async function MotosPublicList() {
  const rows = await getPublishedMotos();
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Motos neuves</h1>
      {!rows.length && <p>Aucune moto publiée pour le moment.</p>}
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {rows.map(m => (
          <Link
            key={m.id}
            href={`/motos/${m.slug || m.id}`}
            className="border rounded overflow-hidden hover:shadow"
          >
            <div className="aspect-[4/3] bg-black/10 relative">
              {m.display_image ? (
                <Image
                  src={m.display_image}
                  alt={`${m.brand||''} ${m.model||''}`}
                  fill
                  sizes="(max-width:768px) 100vw, 33vw"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full grid place-items-center text-sm text-white/60">Pas d’image</div>
              )}
            </div>
            <div className="p-3 text-sm">
              <div className="font-medium">{m.brand} {m.model}</div>
              <div className="opacity-70">{m.year ?? ''} {m.price ? `• ${m.price} TND` : ''}</div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}

