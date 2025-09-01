// src/app/motos/page.tsx
import React from "react";
import FiltersLeft from "@/components/motos/FiltersLeft";
import { createClient } from "@supabase/supabase-js";

// Force le rendu dynamique et pas de cache (Next.js App Router)
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ---------- Types ----------
type Filters = {
  brand_id?: string;
  year_min?: number;
  year_max?: number;
  price_min?: number;
  price_max?: number;
  q?: string;
};
type FParam = {
  filters: Filters;
  page: number;
};

type Brand = { id: string; name: string };
type Moto = {
  id: string;
  brand_id: string | null;
  brand_name?: string | null;
  model_name?: string | null;
  year?: number | null;
  price_tnd?: number | null;
  display_image?: string | null;
};

// ---------- Helpers Base64 (server) ----------
function addBase64Padding(b64: string) {
  const pad = b64.length % 4;
  return pad ? b64 + "=".repeat(4 - pad) : b64;
}
// ⬇️ Correction: accepter 'undefined' et 'null'
function decodeFServer(fParam?: string | null): FParam {
  try {
    if (!fParam) return { filters: {}, page: 0 };
    // URL-safe → standard base64
    const std = addBase64Padding(fParam.replace(/-/g, "+").replace(/_/g, "/"));
    const json = Buffer.from(std, "base64").toString("utf8");
    const obj = JSON.parse(json);
    if (!obj || typeof obj !== "object") return { filters: {}, page: 0 };
    // Normalisation
    const raw: any = obj;
    const filters: Filters = {};
    if (typeof raw.filters === "object" && raw.filters) {
      const f = raw.filters;
      const uuidRe =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      if (typeof f.brand_id === "string" && uuidRe.test(f.brand_id))
        filters.brand_id = f.brand_id;

      const toInt = (v: any) =>
        typeof v === "number"
          ? v
          : typeof v === "string" && v.trim() !== "" && !isNaN(parseInt(v, 10))
          ? parseInt(v, 10)
          : undefined;
      const toNum = (v: any) =>
        typeof v === "number"
          ? v
          : typeof v === "string" && v.trim() !== "" && !isNaN(parseFloat(v))
          ? parseFloat(v)
          : undefined;

      const ymn = toInt(f.year_min);
      if (ymn !== undefined) filters.year_min = ymn;
      const ymx = toInt(f.year_max);
      if (ymx !== undefined) filters.year_max = ymx;

      const pmin = toNum(f.price_min);
      if (pmin !== undefined) filters.price_min = pmin;
      const pmax = toNum(f.price_max);
      if (pmax !== undefined) filters.price_max = pmax;

      if (typeof f.q === "string" && f.q.trim() !== "") filters.q = f.q.trim();
    }

    const page =
      typeof raw.page === "number" && raw.page >= 0 ? raw.page : 0;

    return { filters, page };
  } catch {
    return { filters: {}, page: 0 };
  }
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase env manquants: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export default async function Page({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const supabase = getSupabase();

  // 1) Lire & normaliser f
  const fRaw =
    typeof searchParams.f === "string" ? searchParams.f : undefined;
  const f = decodeFServer(fRaw);
  const { filters } = f;

  // 2) Charger les marques pour le Select (⚠️ adapte le nom de table si besoin)
  //    Si ta table s'appelle autrement (ex: 'moto_brands'), remplace 'brands' ci-dessous.
  const { data: brandsData, error: brandsErr } = await supabase
    .from("brands")
    .select("id, name")
    .order("name", { ascending: true });

  const brands: Brand[] = Array.isArray(brandsData) ? brandsData : [];

  // 3) Construire la requête motos en fonction des filtres
  let query = supabase.from("motos").select("*");

  if (filters.brand_id) query = query.eq("brand_id", filters.brand_id);
  if (filters.year_min !== undefined)
    query = query.gte("year", filters.year_min);
  if (filters.year_max !== undefined)
    query = query.lte("year", filters.year_max);
  if (filters.price_min !== undefined)
    query = query.gte("price_tnd", filters.price_min);
  if (filters.price_max !== undefined)
    query = query.lte("price_tnd", filters.price_max);

  // Recherche texte simple (ajuste les colonnes si elles existent)
  if (filters.q) {
    const like = `%${filters.q}%`;
    query = query.or(`brand_name.ilike.${like},model_name.ilike.${like}`);
  }

  // Tri & limite
  query = query.order("id", { ascending: false }).limit(60);

  const { data: motos, error: motosErr } = await query;

  const loadError = !!motosErr || !!brandsErr;

  return (
    <div className="w-full max-w-[1400px] mx-auto px-3 md:px-6 py-4">
      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar filtres à gauche */}
        <aside className="col-span-12 md:col-span-3 lg:col-span-3">
          <FiltersLeft
            brands={brands}
            initialF={fRaw || ""}
            initialFilters={filters}
          />
        </aside>

        {/* Liste des motos */}
        <main className="col-span-12 md:col-span-9 lg:col-span-9">
          {loadError ? (
            <p className="text-red-500 font-semibold">
              Impossible de charger les motos.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {(motos as Moto[] | null)?.map((m) => (
                <article
                  key={m.id}
                  className="rounded-xl border border-white/10 p-3 hover:shadow-md transition"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-black/10">
                    {m.display_image ? (
                      <img
                        src={m.display_image}
                        alt={`${m.brand_name ?? ""} ${m.model_name ?? ""}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : null}
                  </div>
                  <div className="mt-3">
                    <h3 className="text-base font-semibold">
                      {m.brand_name ?? "—"} {m.model_name ?? ""}
                    </h3>
                    <p className="text-sm opacity-80">
                      {m.year ?? "—"} ·{" "}
                      {m.price_tnd != null ? `${m.price_tnd} TND` : "—"}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
