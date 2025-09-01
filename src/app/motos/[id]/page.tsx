// src/app/motos/[id]/page.tsx
import React from "react";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env manquants");
  return createClient(url, key, { auth: { persistSession: false } });
}

export default async function MotoDetail({ params }: { params: { id: string } }) {
  const supabase = getSupabase();
  const { data: moto } = await supabase
    .from("motos")
    .select("*, brands(name)")
    .eq("id", params.id)
    .single();

  const getImg = (m: any): string | null => {
    return (
      m?.image_url ?? m?.display_image ?? m?.cover_url ?? m?.cover ??
      m?.photo_url ?? m?.photo ?? m?.thumbnail_url ?? m?.thumbnail ?? null
    );
  };

  if (!moto) {
    return <div className="max-w-4xl mx-auto px-4 py-10">Moto introuvable.</div>;
  }

  const img = getImg(moto);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="aspect-[4/3] bg-black/10">
            {img ? (
              <img src={img} alt={`${moto.brands?.name ?? ""} ${moto.model_name ?? ""}`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm opacity-60">Pas d'image</div>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{moto.brands?.name ?? "—"} {moto.model_name ?? ""}</h1>
          <p className="opacity-80">{moto.year ?? "—"} · {moto.price_tnd != null ? `${moto.price_tnd} TND` : "—"}</p>
          {/* Ajoute ici tes sections de caractéristiques techniques */}
        </div>
      </div>
    </div>
  );
}
