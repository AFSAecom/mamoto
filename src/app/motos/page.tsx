import Image from 'next/image'
import Link from 'next/link'
import { fetchMotoCards, formatTND } from '@/lib/db/motos'
import { publicImageUrlFromPath } from '@/lib/storage'

export default async function MotosPage() {
  const cards = await fetchMotoCards(24)

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Motos neuves</h1>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {cards.map((c) => {
          const src = publicImageUrlFromPath(c.primary_image_path)
          const title = `${c.brand ?? ''} ${c.model ?? ''}`.trim()
          return (
            <Link
              key={c.id}
              href={`/motos/${c.id}`}
              className="group bg-white rounded-2xl shadow hover:shadow-md transition p-4 flex flex-col"
            >
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-white border">
                {src ? (
                  <Image
                    src={src}
                    alt={title || 'Moto'}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-gray-400">
                    Image indisponible
                  </div>
                )}
              </div>

              <div className="mt-3">
                <div className="text-sm text-gray-500">{c.brand}</div>
                <div className="font-semibold">{c.model}</div>
                <div className="text-sm text-gray-600">{c.year}</div>
                <div className="text-amber-700 font-medium mt-1">
                  {formatTND(c.price_tnd)}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </main>
  )
}
