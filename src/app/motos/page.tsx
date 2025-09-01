// src/app/motos/page.tsx
import React from "react";
import Link from "next/link";
import FiltersLeft from "@/components/motos/FiltersLeft";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Filters = {
  brand_id?: string;
  year_min?: number;
  year_max?: number;
  price_min?: number;
  price_max?: number;
  q?: string;
  specs?: Record<string, any>;
};
type FParam = { filters: Filters; page: number };

type Brand = { id: string; name: string };

type SpecGroupRow = { id: string; name: string; sort_order: number };
type SpecItemRow = {
  id: string; group_id: string; label: string; unit: string | null; data_type: string; sort_order: number;
};
type NumericRangeRow = { spec_item_id: string; min_value: number | null; max_value: number | null };
type TextOptionRow = { spec_item_id: string; value_text: string; n: number };

function addBase64Padding(b64: string) {
  const pad = b64.length % 4;
  return pad ? b64 + "=".repeat(4 - pad) : b64;
}
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
  if (!url || !key) throw new Error("Supabase env manquants");
  return createClient(url, key, { auth: { persistSession: false } });
}

export default async function Page({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const supabase = getSupabase();

  const fRaw = typeof searchParams.f === "string" ? searchParams.f : undefined;
  const f = decodeFServer(fRaw);
  const { filters } = f;

  const { data: brandsData } = await supabase.from("brands").select("id, name").order("name", { ascending: true });
  const brands: Brand[] = Array.isArray(brandsData) ? brandsData : [];

  const { data: groupsData } = await supabase.from("spec_groups").select("id, name, sort_order").order("sort_order", { ascending: true });
  const { data: itemsData } = await supabase
    .from("spec_items")
    .select("id, group_id, label, unit, data_type, sort_order")
    .order("sort_order", { ascending: true });
  const groups: SpecGroupRow[] = Array.isArray(groupsData) ? groupsData : [];
  const items: SpecItemRow[] = Array.isArray(itemsData) ? itemsData : [];

  // Facettes dynamiques (filtrées)
  const { data: numericRanges } = await supabase.rpc("get_spec_numeric_ranges_filtered", { f });
  const ranges = (Array.isArray(numericRanges) ? numericRanges : []) as NumericRangeRow[];

  const { data: textOptions } = await supabase.rpc("get_spec_text_options_filtered", { f, limit_per_item: 50 });
  const options = (Array.isArray(textOptions) ? textOptions : []) as TextOptionRow[];

  const { data: motos } = await supabase.rpc("search_motos", { f });

  const specSchema = (groups || []).map((g) => ({
    id: g.id,
    name: g.name,
    items: (items || [])
      .filter((it) => it.group_id === g.id)
      .map((it) => ({
        id: it.id,
        label: it.label,
        unit: it.unit,
        data_type: it.data_type,
        range: ranges.find((r) => r.spec_item_id === it.id) || null,
        options: (options || []).filter((o) => o.spec_item_id === it.id).map((o) => ({ value: o.value_text, count: o.n })),
      })),
  }));

  // Helper pour récupérer l'URL d'image la plus probable
  const getImg = (m: any): string | null => {
    return (
      m.image_url ?? m.display_image ?? m.cover_url ?? m.cover ??
      m.photo_url ?? m.photo ?? m.thumbnail_url ?? m.thumbnail ?? null
    );
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-3 md:px-6 py-4">
      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3 lg:col-span-3">
          <FiltersLeft brands={brands} initialF={fRaw || ""} initialFilters={filters} specSchema={specSchema} />
        </aside>
        <main className="col-span-12 md:col-span-9 lg:col-span-9">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(motos as any[] | null)?.map((m) => {
              const img = getImg(m);
              return (
                <Link
                  key={m.id}
                  href={`/motos/${m.id}`}
                  className="group rounded-xl border border-white/10 hover:border-white/20 hover:shadow-md transition overflow-hidden"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-black/10">
                    {img ? (
                      // on reste en <img> pour ne pas dépendre de next.config
                      <img
                        src={img}
                        alt={`${m.brand_name ?? ""} ${m.model_name ?? ""}`}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm opacity-60">
                        Pas d'image
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-base font-semibold line-clamp-1">
                      {m.brand_name ?? "—"} {m.model_name ?? ""}
                    </h3>
                    <p className="text-sm opacity-80">
                      {m.year ?? "—"} · {m.price_tnd != null ? `${m.price_tnd} TND` : "—"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
