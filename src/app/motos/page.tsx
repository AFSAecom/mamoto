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
  specs?: Record<string, any>; // spec_item_id -> {type, ...}
};
type FParam = {
  filters: Filters;
  page: number;
};

type Brand = { id: string; name: string };

type SpecGroupRow = { id: string; name: string; sort_order: number };
type SpecItemRow = {
  id: string;
  group_id: string;
  label: string;
  unit: string | null;
  data_type: string; // 'number' | 'text' | 'boolean' | 'json'...
  sort_order: number;
};

type NumericRangeRow = { spec_item_id: string; min_value: number | null; max_value: number | null };
type TextOptionRow = { spec_item_id: string; value_text: string; n: number };

// ---------- Helpers Base64 (server) ----------
function addBase64Padding(b64: string) {
  const pad = b64.length % 4;
  return pad ? b64 + "=".repeat(4 - pad) : b64;
}
// accepte undefined et null
function decodeFServer(fParam?: string | null): FParam {
  try {
    if (!fParam) return { filters: {}, page: 0 };
    const std = addBase64Padding(fParam.replace(/-/g, "+").replace(/_/g, "/"));
    const json = Buffer.from(std, "base64").toString("utf8");
    const obj = JSON.parse(json);
    if (!obj || typeof obj !== "object") return { filters: {}, page: 0 };
    const raw: any = obj;
    const filters: Filters = (raw.filters && typeof raw.filters === "object") ? raw.filters : {};
    const page = typeof raw.page === "number" && raw.page >= 0 ? raw.page : 0;
    return { filters, page };
  } catch {
    return { filters: {}, page: 0 };
  }
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase env manquants: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
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
  const fRaw = typeof searchParams.f === "string" ? searchParams.f : undefined;
  const f = decodeFServer(fRaw);
  const { filters } = f;

  // 2) Charger les marques pour le Select (⚠️ adapte le nom de table si besoin)
  const { data: brandsData } = await supabase
    .from("brands")
    .select("id, name")
    .order("name", { ascending: true });
  const brands: Brand[] = Array.isArray(brandsData) ? brandsData : [];

  // 3) Charger la taxonomie des specs (groupes + items) + stats (ranges / options)
  const { data: groupsData } = await supabase
    .from("spec_groups")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true });

  const { data: itemsData } = await supabase
    .from("spec_items")
    .select("id, group_id, label, unit, data_type, sort_order")
    .order("sort_order", { ascending: true });

  const groups: SpecGroupRow[] = Array.isArray(groupsData) ? groupsData : [];
  const items: SpecItemRow[] = Array.isArray(itemsData) ? itemsData : [];

  // Stats: min/max pour les numériques
  const { data: numericRanges } = await supabase
    .rpc("get_spec_numeric_ranges");
  const ranges = (Array.isArray(numericRanges) ? numericRanges : []) as NumericRangeRow[];

  // Options texte (limitées à 50 valeurs par item)
  const { data: textOptions } = await supabase
    .rpc("get_spec_text_options", { limit_per_item: 50 });
  const options = (Array.isArray(textOptions) ? textOptions : []) as TextOptionRow[];

  // 4) Rechercher les motos via la RPC (gère toutes les conditions y compris specs)
  const { data: motos, error: motosErr } = await supabase.rpc("search_motos", { f });

  const loadError = !!motosErr;

  // Prépare un objet simple pour la sidebar (groupes -> items -> meta + range/options)
  const specSchema = groups.map((g) => ({
    id: g.id,
    name: g.name,
    items: items
      .filter((it) => it.group_id === g.id)
      .map((it) => ({
        id: it.id,
        label: it.label,
        unit: it.unit,
        data_type: it.data_type,
        range: ranges.find((r) => r.spec_item_id === it.id) || null,
        options: options.filter((o) => o.spec_item_id === it.id).map((o) => ({ value: o.value_text, count: o.n })),
      })),
  }));

  return (
    <div className="w-full max-w-[1400px] mx-auto px-3 md:px-6 py-4">
      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar filtres à gauche */}
        <aside className="col-span-12 md:col-span-3 lg:col-span-3">
          <FiltersLeft
            brands={brands}
            initialF={fRaw || ""}
            initialFilters={filters}
            specSchema={specSchema}
          />
        </aside>

        {/* Liste des motos */}
        <main className="col-span-12 md:col-span-9 lg:col-span-9">
          {loadError ? (
            <p className="text-red-500 font-semibold">Impossible de charger les motos.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {(motos as any[] | null)?.map((m) => (
                <article key={m.id} className="rounded-xl border border-white/10 p-3 hover:shadow-md transition">
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
                      {m.year ?? "—"} · {m.price_tnd != null ? `${m.price_tnd} TND` : "—"}
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
