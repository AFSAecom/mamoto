"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  value: {
    brands: string[];
    years: number[];
    priceMin: number | null;
    priceMax: number | null;
    search: string | null;
    sort: "price_asc" | "price_desc" | "year_desc" | "year_asc" | "brand_asc" | "brand_desc";
    limit: number;
    offset: number;
    page: number;
  };
  onChange: (next: Partial<Props["value"]>) => void;
  onReset: () => void;
};

function useDebouncedCallback<T extends (...args: any[]) => any>(cb: T, delay = 400) {
  const to = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (...args: Parameters<T>) => {
    if (to.current) clearTimeout(to.current);
    to.current = setTimeout(() => cb(...args), delay);
  };
}

export default function MotoFilters({ value, onChange, onReset }: Props) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);

  const debouncedChange = useDebouncedCallback((next: Partial<Props["value"]>) => onChange(next), 400);
  useEffect(() => {
    debouncedChange(local);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(local)]);

  const allYears = useMemo(() => [2025, 2024, 2023, 2022], []);
  const allBrands = useMemo(() => ["Aprilia","BMW","Honda","Kawasaki","KTM","Suzuki","Triumph","Yamaha","Harley-Davidson"], []);

  return (
    <section className="border rounded p-3 bg-white">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-sm mb-1">Marques</label>
          <select
            multiple
            className="w-full border rounded p-2 h-28"
            value={local.brands}
            onChange={(e) => {
              const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
              setLocal((s) => ({ ...s, brands: opts }));
            }}
          >
            {allBrands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Années</label>
          <div className="flex flex-wrap gap-2">
            {allYears.map((y) => {
              const active = local.years.includes(y);
              return (
                <button
                  key={y}
                  className={`px-3 py-1 text-sm border rounded ${active ? "bg-black text-white" : "bg-white"}`}
                  onClick={() => {
                    setLocal((s) => ({
                      ...s,
                      years: active ? s.years.filter((v) => v !== y) : [...s.years, y],
                    }));
                  }}
                >
                  {y}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Prix (TND)</label>
          <div className="flex gap-2">
            <input
              className="border rounded p-2 w-full"
              type="number"
              placeholder="Min"
              value={local.priceMin ?? ""}
              onChange={(e) => setLocal((s) => ({ ...s, priceMin: e.target.value ? Number(e.target.value) : null }))}
            />
            <input
              className="border rounded p-2 w-full"
              type="number"
              placeholder="Max"
              value={local.priceMax ?? ""}
              onChange={(e) => setLocal((s) => ({ ...s, priceMax: e.target.value ? Number(e.target.value) : null }))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Recherche</label>
          <input
            className="border rounded p-2 w-full"
            placeholder="Marque ou modèle…"
            value={local.search ?? ""}
            onChange={(e) => setLocal((s) => ({ ...s, search: e.target.value || null }))}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Tri</label>
          <select
            className="border rounded p-2 w-full"
            value={local.sort}
            onChange={(e) => setLocal((s) => ({ ...s, sort: e.target.value as any }))}
          >
            <option value="price_asc">Prix ↑</option>
            <option value="price_desc">Prix ↓</option>
            <option value="year_desc">Année ↓</option>
            <option value="year_asc">Année ↑</option>
            <option value="brand_asc">Marque A→Z</option>
            <option value="brand_desc">Marque Z→A</option>
          </select>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button className="px-3 py-2 border rounded" onClick={() => onReset()}>Réinitialiser</button>
        <div className="text-xs text-gray-500">Astuce: la sélection multiple fonctionne avec Ctrl/Cmd.</div>
      </div>
    </section>
  );
}