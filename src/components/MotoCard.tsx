"use client";
import Link from "next/link";

export default function MotoCard({ moto }: { moto: {
  id: string;
  brand_name: string;
  model_name: string;
  year: number | null;
  price_tnd: number | null;
}}) {
  const img = `/images/motos/${moto.id}.webp`; // fallback simple
  return (
    <Link href={`/motos/${moto.id}`} className="block border rounded overflow-hidden hover:shadow-sm bg-white">
      <div className="aspect-[4/3] bg-gray-100">
        <img
          src={img}
          alt={`${moto.brand_name} ${moto.model_name}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/images/placeholder.webp";
          }}
          loading="lazy"
        />
      </div>
      <div className="p-3">
        <div className="text-sm text-gray-500">{moto.brand_name}</div>
        <div className="font-medium">{moto.model_name} {moto.year ? `(${moto.year})` : ""}</div>
        <div className="text-sm text-gray-700 mt-1">{moto.price_tnd != null ? `${moto.price_tnd} TND` : "—"}</div>
      </div>
    </Link>
  );
}
