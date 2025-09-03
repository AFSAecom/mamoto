"use client";
import Link from "next/link";
import type { MotoCard as MotoCardType } from "@/lib/public/motos";

export default function MotoCard({ moto }: { moto: MotoCardType }) {
  const img = `/images/motos/${moto.id}.webp`;
  const brand = moto.brand_name ?? "";
  const model = moto.model_name ?? "";
  return (
    <Link
      href={`/motos/${moto.id}`}
      className="block border rounded overflow-hidden hover:shadow-sm bg-white"
    >
      <div className="aspect-[4/3] bg-gray-100">
        <img
          src={img}
          alt={`${brand} ${model}`.trim()}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/images/placeholder.webp";
          }}
          loading="lazy"
        />
      </div>
      <div className="p-3">
        <div className="text-sm text-gray-500">{brand}</div>
        <div className="font-medium">
          {model} {moto.year ? `(${moto.year})` : ""}
        </div>
        <div className="text-sm text-gray-700 mt-1">
          {moto.price_tnd != null ? `${moto.price_tnd} TND` : "—"}
        </div>
      </div>
    </Link>
  );
}
