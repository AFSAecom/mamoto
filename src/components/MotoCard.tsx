import Link from "next/link";
import type { Moto } from "@/types/moto";

interface MotoCardProps {
  moto: Moto;
}

export default function MotoCard({ moto }: MotoCardProps) {
  const imgSrc = moto.imageUrl ?? "/images/placeholder.jpg";
  return (
    <div className="rounded-xl border overflow-hidden hover:shadow">
      <Link href={`/modeles/${moto.id}`} className="block">
        <div className="aspect-[16/9] bg-gray-100">
          <img
            src={imgSrc}
            alt={`${moto.brand} ${moto.model}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="p-4">
          <div className="text-sm text-gray-500">{moto.brand}</div>
          <div className="text-lg font-medium">
            {moto.model}
            {moto.year ? ` · ${moto.year}` : ""}
          </div>
          {moto.price != null && <div className="mt-1">Prix: {moto.price}</div>}
        </div>
      </Link>
    </div>
  );
}
