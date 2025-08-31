import Image from 'next/image'
import { fetchMotoFull, formatTND } from '@/lib/db/motos'
import { publicImageUrlFromPath } from '@/lib/storage'

export default async function MotoDetailPage({ params }: { params: { id: string } }) {
  const moto = await fetchMotoFull(params.id)
  if (!moto) {
    return (
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-xl font-semibold">Moto introuvable</h1>
        <p className="text-sm text-gray-500 mt-2">Vérifie l’URL ou la disponibilité.</p>
      </main>
    )
  }

  const title = `${moto.brand ?? ''} ${moto.model ?? ''} ${moto.year ?? ''}`.trim()

  // Tri des images (principale d’abord)
  const images = Array.isArray(moto.images)
    ? [...moto.images].sort(
        (a: any, b: any) =>
          (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || (a.sort_order ?? 0) - (b.sort_order ?? 0)
      )
    : []

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
        <p className="text-lg text-gray-700">{formatTND(moto.price_tnd)}</p>
      </header>

      {/* Galerie */}
      {images.length > 0 && (
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img: any, idx: number) => {
            const src = publicImageUrlFromPath(img.path)
            return (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border">
                {src ? (
                  <Image
                    src={src}
                    alt={img.alt ?? title}
                    fill
                    className="object-contain bg-white"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-gray-400">Image indisponible</div>
                )}
              </div>
            )
          })}
        </section>
      )}

      {/* Spécifications par groupes */}
      <section className="space-y-8">
        {Array.isArray(moto.specs) &&
          moto.specs.map((group: any, gi: number) => (
            <div key={gi} className="bg-white rounded-2xl shadow p-5">
              <h2 className="text-xl font-semibold mb-4">{group.group}</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {Array.isArray(group.items) &&
                  group.items.map((it: any, ii: number) => {
                    const value =
                      it.value_text ??
                      (it.value_number != null ? `${it.value_number}${it.unit ? ' ' + it.unit : ''}` : null) ??
                      (typeof it.value_boolean === 'boolean' ? (it.value_boolean ? 'Oui' : 'Non') : null)

                    if (value == null) return null
                    return (
                      <div key={ii} className="flex justify-between gap-3 border-b py-2">
                        <span className="text-gray-600">{it.label}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
      </section>
    </main>
  )
}
