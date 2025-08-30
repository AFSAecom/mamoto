import Image from 'next/image';
import Link from 'next/link';
import type { MotoCard as Moto } from '@/lib/public/motos';

interface MotoCardProps {
  moto: Moto & { display_image: string | null };
}

export default function MotoCard({ moto }: MotoCardProps) {
  return (
    <Link
      href={`/motos/${moto.id}`}
      className="rounded-xl border overflow-hidden hover:shadow block"
    >
      <div className="aspect-[16/9] bg-black/10 relative">
        {moto.display_image ? (
          <Image
            src={moto.display_image}
            alt={`${moto.brand || ''} ${moto.model || ''}`}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-sm text-white/60">
            Pas d’image
          </div>
        )}
      </div>
      <div className="p-4 text-sm">
        <div className="text-lg font-medium">
          {moto.brand} {moto.model}
        </div>
        <div className="opacity-70">
          {moto.year ?? ''} {moto.price ? `• ${moto.price} TND` : ''}
        </div>
      </div>
    </Link>
  );
}
