import Image from "next/image";
import Link from "next/link";
import type { MotoCard as Moto } from "@/lib/public/motos";

interface MotoCardProps {
  moto: Moto;
}

export default function MotoCard({ moto }: MotoCardProps) {
  const src = moto.display_image || "/images/placeholder.jpg";
  return (
    <div className="rounded-xl border overflow-hidden hover:shadow">
      <Link href={`/motos/${moto.slug ?? moto.id}`} className="block">
        <div className="aspect-[16/9] bg-gray-100 relative">
          <Image
            src={src}
            alt={moto.model || ''}
            fill
            className="object-cover"
          />
        </div>
        <div className="p-4">
          <div className="text-lg font-medium">{moto.model}</div>
        </div>
      </Link>
    </div>
  );
}

