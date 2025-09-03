"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import MotoFilters from "../../components/MotoFilters";
import MotoCard from "../../components/MotoCard";

type Moto = {
  id: string;
  brand_id: string | null;
  brand_name: string;
  model_name: string;
  year: number | null;
  price_tnd: number | null;
  featured: boolean | null;
  total_count: number;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function parseSearchParams(searchParams: URLSearchParams) {
  const brands = searchParams.get("brand")?.split(",").filter(Boolean) ?? [];
  const years = (searchParams.get("year") || "")
    .split(",")
    .filter(Boolean)
    .map((n) => Number(n));
  const priceMin = searchParams.get("price_min")
    ? Number(searchParams.get("price_min"))
    : null;
  const priceMax = searchParams.get("price_max")
    ? Number(searchParams.get("price_max"))
    : null;
  const search = searchParams.get("q") || null;
  const sort = (searchParams.get("sort") as
    | "price_asc"
    | "price_desc"
    | "year_desc"
    | "year_asc"
    | "brand_asc"
    | "brand_desc") || "price_asc";
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "24");
  const offset = (page - 1) * limit;
  return { brands, years, priceMin, priceMax, search, sort, limit, offset, page };
}

export default function MotosPage() {
  const [motos, setMotos] = useState<Moto[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [urlState, setUrlState] = useState(() => {
    if (typeof window === "undefined") return parseSearchParams(new URLSearchParams());
    return parseSearchParams(new URLSearchParams(window.location.search));
  });

  // Sync URL when filters change (debounced inside MotoFilters)
  useEffect(() => {
    const sp = new URLSearchParams();
    if (urlState.brands.length) sp.set("brand", urlState.brands.join(","));
    if (urlState.years.length) sp.set("year", urlState.years.join(","));
    if (urlState.priceMin !== null) sp.set("price_min", String(urlState.priceMin));
    if (urlState.priceMax !== null) sp.set("price_max", String(urlState.priceMax));
    if (urlState.search) sp.set("q", urlState.search);
    if (urlState.sort) sp.set("sort", urlState.sort);
    if (urlState.page && urlState.page > 1) sp.set("page", String(urlState.page));
    if (urlState.offset) sp.set("limit", String(urlState.limit));
    const qs = sp.toString();
    const newUrl = qs ? `/motos?${qs}` : `/motos`;
    if (typeof window !== "undefined" && newUrl !== window.location.pathname + window.location.search) {
      window.history.replaceState(null, "", newUrl);
    }
  }, [urlState]);

  async function fetchMotos() {
    setLoading(true);
    setError(null);
    try {
      const { brands, years, priceMin, priceMax, search, sort, limit, offset } = urlState;
      const { data, error } = await supabase.rpc("fn_search_motos", {
        p_brand_names: brands.length ? brands : null,
        p_years: years.length ? years : null,
        p_price_min: priceMin,
        p_price_max: priceMax,
        p_search: search,
        p_sort: sort,
        p_limit: limit,
        p_offset: offset,
      });
      if (error) throw error;
      const list = (data || []) as Moto[];
      setMotos(list);
      setTotal(list.length ? Number(list[0].total_count) : 0);
    } catch (e: any) {
      setError(e.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(urlState)]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / urlState.limit)), [total, urlState.limit]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">Motos neuves</h1>
      <MotoFilters
        value={urlState}
        onChange={(next) => setUrlState((prev) => ({ ...prev, ...next, page: 1, offset: 0 }))}
        onReset={() => setUrlState({ brands: [], years: [], priceMin: null, priceMax: null, search: null, sort: "price_asc", limit: 24, offset: 0, page: 1 })}
      />
      {error && (
        <div className="mt-4 p-3 border border-red-300 bg-red-50 rounded">Erreur : {error}</div>
      )}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse bg-gray-100 rounded" />
          ))}
        </div>
      ) : motos.length === 0 ? (
        <div className="mt-6 text-gray-600">Aucun résultat. Essayez d’élargir vos filtres.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            {motos.map((m) => (
              <MotoCard key={m.id} moto={m} />
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              className="px-3 py-2 border rounded disabled:opacity-50"
              disabled={urlState.page <= 1}
              onClick={() => setUrlState((s) => ({ ...s, page: s.page - 1, offset: (s.page - 2) * s.limit }))}
            >
              Précédent
            </button>
            <span className="text-sm">Page {urlState.page} / {totalPages}</span>
            <button
              className="px-3 py-2 border rounded disabled:opacity-50"
              disabled={urlState.page >= totalPages}
              onClick={() => setUrlState((s) => ({ ...s, page: s.page + 1, offset: s.page * s.limit }))}
            >
              Suivant
            </button>
          </div>
        </>
      )}
    </main>
  );
}
