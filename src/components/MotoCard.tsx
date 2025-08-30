import Image from 'next/image';
import Link from 'next/link';
import { publicImageUrl } from '@/lib/storage';

type Moto = {
  id: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  price: number | null;
  slug: string | null;
  image_path?: string | null;
  display_image?: string | null;
};

interface MotoCardProps {
  moto: Moto;
}

function formatPrice(price?: number | null) {
  if (price == null) return '';
  return new Intl.NumberFormat('fr-TN').format(price) + ' TND';
}

export default function MotoCard({ moto }: MotoCardProps) {
  const src =
    publicImageUrl(moto.image_path ?? moto.display_image ?? undefined) ||
    '/images/placeholder.jpg';
  const title = [moto.brand, moto.model, moto.year ?? '']
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    <div className="rounded-xl border overflow-hidden hover:shadow">
      <Link href={`/motos/${moto.slug ?? moto.id}`} className="block">
        <div className="aspect-[16/9] bg-gray-100 relative">
          <Image
            src={src}
            alt={title || ''}
            fill
            className="object-cover"
          />
        </div>
        <div className="p-4">
          <div className="text-lg font-medium">{title}</div>
          {moto.price != null && (
            <div className="text-sm text-muted-foreground">
              {formatPrice(moto.price)}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

