import Image from "next/image";
import Link from "next/link";
import type { Moto } from "@/lib/motos";

interface MotoCardProps {
  moto: Moto;
}

export default function MotoCard({ moto }: MotoCardProps) {
  return (
    <Link
      href={`/motos/${moto.slug}`}
      className="block rounded-xl border overflow-hidden hover:shadow"
    >
      <div className="aspect-[4/3] bg-gray-100">
        <Image
          src={moto.imageUrl || "/images/placeholder.jpg"}
          alt={moto.model}
          width={400}
          height={300}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-medium">{moto.model}</h3>
      </div>
    </Link>
  );
}

