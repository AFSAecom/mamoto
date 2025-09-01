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

const IMG_EXT = /\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i;
const isHttpUrl = (s: any) => typeof s === "string" && /^https?:\/\//i.test(s) && IMG_EXT.test(s);
const looksLikePath = (s: any) => typeof s === "string" && IMG_EXT.test(s) && !/^https?:\/\//i.test(s);

/** Transforme une valeur en URL d'image :
 * - Si HTTP(S) -> garde
 * - Si chemin "bucket/key.jpg" -> construit URL publique Supabase
 */
function asImageUrl(val: any): string | null {
  if (!val) return null;
  if (isHttpUrl(val)) return val;
  if (looksLikePath(val)) {
    const supa = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supa) return null;
    const path = String(val).replace(/^\/+/, "");
    const parts = path.split("/");
    if (parts.length >= 2) {
      const bucket = parts.shift();
      const key = parts.join("/");
      return `${supa}/storage/v1/object/public/${bucket}/${key}`;
    }
    // Si la valeur n'a pas de bucket explicite, on tente tel quel
    return `${supa}/storage/v1/object/public/${path}`;
  }
  return null;
}

function sniffImageFromRecord(m: any): string | null {
  const commons = ["image_url","display_image","cover_url","cover","photo_url","photo","thumbnail_url","thumbnail"];
  for (const k of commons) {
    const v = (m as any)?.[k];
    const url = asImageUrl(v);
    if (url) return url;
  }
  const listKeys = ["images","gallery","photos","imgs","pictures"];
  for (const k of listKeys) {
    const v = (m as any)?.[k];
    if (Array.isArray(v)) {
      for (const x of v) {
        const url = asImageUrl(x);
        if (url) return url;
      }
    }
  }
  for (const v of Object.values(m || {})) {
    const url = asImageUrl(v);
    if (url) return url;
  }
  const scanDeep = (val: any): string | null => {
    if (!val) return null;
    const url = asImageUrl(val);
    if (url) return url;
    if (Array.isArray(val)) {
      for (const x of val) {
        const r = scanDeep(x);
        if (r) return r;
      }
    } else if (typeof val === "object") {
      for (const vv of Object.values(val)) {
        const r = scanDeep(vv);
        if (r) return r;
      }
    }
    return null;
  };
  for (const v of Object.values(m || {})) {
    const r = scanDeep(v);
    if (r) return r;
  }
  return null;
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

  return (
    <div className="w-full max-w-[1400px] mx-auto px-3 md:px-6 py-4">
      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3 lg:col-span-3">
          <FiltersLeft brands={brands} initialF={fRaw || ""} initialFilters={filters} specSchema={specSchema} />
        </aside>
        <main className="col-span-12 md:col-span-9 lg:col-span-9">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(motos as any[] | null)?.map((m) => {
              const img = sniffImageFromRecord(m);
              return (
                <Link
                  key={m.id}
                  href={`/motos/${m.id}`}
                  className="group rounded-xl border border-white/10 hover:border-white/20 hover:shadow-md transition overflow-hidden"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-black/10">
                    {img ? (
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
