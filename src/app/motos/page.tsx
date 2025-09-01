// src/app/motos/page.tsx
import React from "react";
import Link from "next/link";
import FiltersLeft from "@/components/motos/FiltersLeft";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { slugify } from "./_slug";
import CardGallery from "@/components/motos/CardGallery";

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

type Range = { min: number; max: number };

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

function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !key) throw new Error("Supabase env manquants");
  return createClient(url, key, { auth: { persistSession: false } });
}

/** ---------- Image helpers ---------- */
const IMG_EXT = /\.(png|jpe?g|webp|gif|bmp|svg)$/i;

async function listImagesFor(
  supabase: SupabaseClient,
  brandName: string | null | undefined,
  modelName: string | null | undefined
): Promise<string[]> {
  const bucket = process.env.NEXT_PUBLIC_STORAGE_BUCKET || "motos";
  const folder = `${slugify(String(brandName || ""))}-${slugify(String(modelName || ""))}`;
  if (!folder.replace(/-/g, "")) return [];
  const { data } = await supabase.storage
    .from(bucket)
    .list(folder, { limit: 100, sortBy: { column: "name", order: "asc" } });
  const files = (data || []).filter((f: any) => IMG_EXT.test(f.name));
  return files.map(
    (f: any) => supabase.storage.from(bucket).getPublicUrl(`${folder}/${f.name}`).data.publicUrl
  );
}
/** ---------- /Image helpers ---------- */

// Helpers pour filtrer les items doublons (Prix / Année) dans les groupes
function normalizeLabel(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // <-- CORRECT: enlève les accents
    .replace(/\s+/g, " ")
    .trim();
}
const HIDE_LABELS = new Set([
  "annee",
  "year",
  "prix",
  "prix (tnd)",
  "prix tnd",
  "price",
]);

// Récupère min/max globaux pour year et price_tnd
async function getGlobalRanges(supabase: SupabaseClient): Promise<{ year: Range; price: Range }> {
  // YEAR min/max
  const { data: yMinRows } = await supabase
    .from("motos")
    .select("year")
    .not("year", "is", null)
    .order("year", { ascending: true })
    .limit(1);
  const { data: yMaxRows } = await supabase
    .from("motos")
    .select("year")
    .not("year", "is", null)
    .order("year", { ascending: false })
    .limit(1);
  const minYear = yMinRows && yMinRows.length > 0 ? Number(yMinRows[0].year) : 1900;
  const maxYear = yMaxRows && yMaxRows.length > 0 ? Number(yMaxRows[0].year) : minYear;

  // PRICE min/max
  const { data: pMinRows } = await supabase
    .from("motos")
    .select("price_tnd")
    .not("price_tnd", "is", null)
    .order("price_tnd", { ascending: true })
    .limit(1);
  const { data: pMaxRows } = await supabase
    .from("motos")
    .select("price_tnd")
    .not("price_tnd", "is", null)
    .order("price_tnd", { ascending: false })
    .limit(1);
  const minPrice = pMinRows && pMinRows.length > 0 ? Number(pMinRows[0].price_tnd) : 0;
  const maxPrice = pMaxRows && pMaxRows.length > 0 ? Number(pMaxRows[0].price_tnd) : minPrice;

  return { year: { min: minYear, max: maxYear }, price: { min: minPrice, max: maxPrice } };
}

export default async function Page({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const supabase = getSupabase();

  const fRaw = typeof searchParams.f === "string" ? searchParams.f : undefined;
  const f = decodeFServer(fRaw);
  const { filters } = f;

  const [{ data: brandsData }, rangesGlobal] = await Promise.all([
    supabase.from("brands").select("id, name").order("name", { ascending: true }),
    getGlobalRanges(supabase),
  ]);
  const brands: Brand[] = Array.isArray(brandsData) ? brandsData : [];

  const { data: groupsData } = await supabase.from("spec_groups").select("id, name, sort_order").order("sort_order", { ascending: true });
  const { data: itemsData } = await supabase
    .from("spec_items")
    .select("id, group_id, label, unit, data_type, sort_order")
    .order("sort_order", { ascending: true });
  const groups: SpecGroupRow[] = Array.isArray(groupsData) ? groupsData : [];
  const items: SpecItemRow[] = Array.isArray(itemsData) ? itemsData : [];

  // Facettes dynamiques
  const { data: numericRanges } = await supabase.rpc("get_spec_numeric_ranges_filtered", { f });
  const ranges = (Array.isArray(numericRanges) ? numericRanges : []) as NumericRangeRow[];
  const { data: textOptions } = await supabase.rpc("get_spec_text_options_filtered", { f, limit_per_item: 50 });
  const options = (Array.isArray(textOptions) ? textOptions : []) as TextOptionRow[];

  // Résultats (via RPC existante)
  const { data: motos } = await supabase.rpc("search_motos", { f });
  const list = Array.isArray(motos) ? (motos as any[]) : [];

  // Récupère toutes les images par moto (via Storage.list)
  const withImages = await Promise.all(
    list.map(async (m) => {
      const brand = m.brand_name ?? m.brands?.name;
      const model = m.model_name ?? m.model;
      const urls = await listImagesFor(supabase, brand, model);
      return { m, urls };
    })
  );

  // --------- SPEC SCHEMA (on retire Prix / Année des groupes) ---------
  const specSchema = (groups || []).map((g) => ({
    id: g.id,
    name: g.name,
    items: (items || [])
      .filter((it) => it.group_id === g.id)
      .filter((it) => !HIDE_LABELS.has(normalizeLabel(it.label)))
      .map((it) => ({
        id: it.id,
        label: it.label,
        unit: it.unit,
        data_type: it.data_type,
        range: ranges.find((r) => r.spec_item_id === it.id) || null,
        options: (options || []).filter((o) => o.spec_item_id === it.id).map((o) => ({ value: o.value_text, count: o.n })),
      })),
  })).filter((g) => g.items.length > 0);
  // --------------------------------------------------------------------

  return (
    <div className="w-full max-w-[1400px] mx-auto px-3 md:px-6 py-4">
      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3 lg:col-span-3">
          <FiltersLeft
            brands={brands}
            initialF={fRaw || ""}
            initialFilters={filters}
            specSchema={specSchema}
            priceRange={rangesGlobal.price}
            yearRange={rangesGlobal.year}
          />
        </aside>
        <main className="col-span-12 md:col-span-9 lg:col-span-9">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {withImages.map(({ m, urls }) => (
              <Link
                key={m.id}
                href={`/motos/${m.id}`}
                className="group rounded-xl border border-white/10 hover:border-white/20 hover:shadow-md transition overflow-hidden"
              >
                <CardGallery urls={urls} />

                <div className="p-3">
                  <h3 className="text-base font-semibold line-clamp-1">
                    {m.brand_name ?? "—"} {m.model_name ?? ""}
                  </h3>
                  <p className="text-sm opacity-80">
                    {m.year ?? "—"} · {m.price_tnd != null ? `${m.price_tnd} TND` : "—"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
