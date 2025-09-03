'use client';
import Image from 'next/image';
import Link from 'next/link';
import { resolveImageUrl } from '@/lib/imageUrl';

export default function MotoCard({ moto }: { moto: any }) {
  const img = resolveImageUrl(
    moto?.display_image ||
      moto?.image_url ||
      moto?.image_path ||
      moto?.primary_image_path
  )
  const price = typeof moto.price_tnd === 'number' ? moto.price_tnd : moto.price
  const brand = moto.brand_name || moto.brand
  const model = moto.model_name || moto.model
  return (
    <Link
      href={`/motos/${moto.id}`}
      className="block rounded-2xl border overflow-hidden hover:shadow"
    >
      <div className="aspect-[4/3] bg-neutral-200 relative">
        {img ? (
          <Image
            src={img}
            alt={`${brand} ${model}`}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-sm opacity-70">Image manquante</div>
        )}
      </div>
      <div className="p-3">
        <div className="font-semibold">
          {brand} {model} {moto.year}
        </div>
        {typeof price === 'number' ? (
          <div className="opacity-70">{price} TND</div>
        ) : null}
      </div>
    </Link>
  )
}
