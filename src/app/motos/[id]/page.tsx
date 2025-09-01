import { getMotoFull, formatTND } from '@/lib/db/motos'
import getPublicImageUrl from '@/lib/getPublicImageUrl'
import MotoImage from '@/components/MotoImage'

export default async function MotoDetailPage({ params }: { params: { id: string } }) {
  let moto: any
  try {
    moto = await getMotoFull(params.id)
  } catch {
    return (
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-xl font-semibold">Moto introuvable</h1>
        <p className="text-sm text-gray-500 mt-2">Vérifie l’URL ou la disponibilité.</p>
      </main>
    )
  }

  const title = `${moto.brand ?? ''} ${moto.model ?? ''} ${moto.year ?? ''}`.trim()

  return (
    <div className="max-w-6xl mx-auto">
      <header className="sticky top-0 z-10 bg-white p-6 shadow">
        <h1 className="text-2xl md:text-3xl font-bold">{`${moto.brand} ${moto.model} ${moto.year ?? ''}`.trim()}</h1>
        <p className="text-lg text-gray-700">{formatTND(moto.price_tnd)}</p>
      </header>

      {Array.isArray(moto.images) && moto.images.length > 0 && (
        <section className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {moto.images.map((img: any, idx: number) => {
            const src = getPublicImageUrl(img.url)
            return (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border">
                <MotoImage
                  src={src}
                  alt={img.alt ?? title}
                  fill
                  className="object-contain bg-white"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  unoptimized
                />
              </div>
            )
          })}
        </section>
      )}

      <section className="p-6 space-y-8">
        {Array.isArray(moto.specs) &&
          moto.specs.map((group: any, gi: number) => (
            <div key={gi} className="bg-white rounded-2xl shadow p-5">
              <h2 className="text-xl font-semibold mb-4">{group.group}</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {Array.isArray(group.items) &&
                  group.items.map((it: any, ii: number) => (
                    <div key={ii} className="flex justify-between gap-3 border-b py-2">
                      <span className="text-gray-600">{it.label}</span>
                      <span className="font-medium">
                        {it.value ? `${it.value}${it.unit ? ` ${it.unit}` : ''}` : '-'}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
      </section>
    </div>
  )
}
