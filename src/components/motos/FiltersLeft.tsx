// src/components/motos/FiltersLeft.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Brand = { id: string; name: string };
type Filters = {
  brand_id?: string;
  year_min?: number;
  year_max?: number;
  price_min?: number;
  price_max?: number;
  q?: string;
  specs?: Record<string, any>;
};
export type SpecGroup = {
  id: string;
  name: string;
  items: Array<{
    id: string;
    label: string;
    unit: string | null;
    data_type: string;
    range: { min_value: number | null; max_value: number | null } | null;
    options: Array<{ value: string; count: number }>;
  }>;
};
type Range = { min: number; max: number };

function utoa(json: string) {
  if (typeof window === "undefined") {
    // @ts-ignore
    return Buffer.from(json, "utf8").toString("base64");
  }
  return btoa(unescape(encodeURIComponent(json)));
}
function atou(b64: string) {
  if (typeof window === "undefined") {
    // @ts-ignore
    return Buffer.from(b64, "base64").toString("utf8");
  }
  return decodeURIComponent(escape(atob(b64)));
}
function encodeF(f: { filters: Filters; page: number }) {
  const json = JSON.stringify(f);
  const b64 = utoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return b64;
}

export default function FiltersLeft({
  brands,
  initialF = "",
  initialFilters = {},
  specSchema = [],
  priceRange,
  yearRange,
}: {
  brands: Brand[];
  initialF?: string;
  initialFilters?: Filters;
  specSchema?: SpecGroup[];
  priceRange?: Range;
  yearRange?: Range;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const priceDefaults: Range = priceRange ?? { min: 0, max: 500000 };
  const yearDefaults: Range = yearRange ?? { min: 1990, max: new Date().getFullYear() };

  const [filters, setFilters] = useState<Filters>(() => ({
    ...initialFilters,
    price_min: initialFilters.price_min ?? priceDefaults.min,
    price_max: initialFilters.price_max ?? priceDefaults.max,
    year_min: initialFilters.year_min ?? yearDefaults.min,
    year_max: initialFilters.year_max ?? yearDefaults.max,
  }));

  // Sync URL à chaque modif
  useEffect(() => {
    const fEnc = encodeF({ filters, page: 0 });
    const q = new URLSearchParams(searchParams?.toString());
    if (fEnc) q.set("f", fEnc);
    router.replace(`/motos?${q.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
  }

  return (
    <div className="space-y-5">
      {/* Marques */}
      <div>
        <div className="text-sm font-semibold mb-1">Toutes marques</div>
        <select
          className="w-full bg-transparent border border-white/20 rounded p-2 text-sm"
          value={filters.brand_id ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, brand_id: e.target.value || undefined }))}
        >
          <option value="">Toutes marques</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* Mots clefs */}
      <div>
        <div className="text-sm font-semibold mb-1">Mots clefs</div>
        <input
          className="w-full bg-transparent border border-white/20 rounded p-2 text-sm"
          placeholder="Rechercher"
          defaultValue={filters.q ?? ""}
          onBlur={(e) => setFilters((f) => ({ ...f, q: e.target.value || undefined }))}
        />
      </div>

      {/* Prix (bornes dynamiques) */}
      <div>
        <div className="text-sm font-semibold mb-1">Prix</div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            className="w-1/2 bg-transparent border border-white/20 rounded p-2 text-sm"
            value={filters.price_min ?? priceDefaults.min}
            min={priceDefaults.min}
            max={filters.price_max ?? priceDefaults.max}
            onChange={(e) => {
              const v = clamp(Number(e.target.value || priceDefaults.min), priceDefaults.min, filters.price_max ?? priceDefaults.max);
              setFilters((f) => ({ ...f, price_min: v }));
            }}
          />
          <input
            type="number"
            className="w-1/2 bg-transparent border border-white/20 rounded p-2 text-sm"
            value={filters.price_max ?? priceDefaults.max}
            min={filters.price_min ?? priceDefaults.min}
            max={priceDefaults.max}
            onChange={(e) => {
              const v = clamp(Number(e.target.value || priceDefaults.max), filters.price_min ?? priceDefaults.min, priceDefaults.max);
              setFilters((f) => ({ ...f, price_max: v }));
            }}
          />
        </div>
        <input
          type="range"
          min={priceDefaults.min}
          max={priceDefaults.max}
          step={100}
          value={filters.price_min ?? priceDefaults.min}
          onChange={(e) => {
            const v = Number(e.target.value);
            setFilters((f) => ({ ...f, price_min: Math.min(v, f.price_max ?? priceDefaults.max) }));
          }}
          className="w-full mt-2"
        />
        <input
          type="range"
          min={priceDefaults.min}
          max={priceDefaults.max}
          step={100}
          value={filters.price_max ?? priceDefaults.max}
          onChange={(e) => {
            const v = Number(e.target.value);
            setFilters((f) => ({ ...f, price_max: Math.max(v, f.price_min ?? priceDefaults.min) }));
          }}
          className="w-full -mt-1"
        />
      </div>

      {/* Année (bornes dynamiques) */}
      <div>
        <div className="text-sm font-semibold mb-1">Année</div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            className="w-1/2 bg-transparent border border-white/20 rounded p-2 text-sm"
            value={filters.year_min ?? yearDefaults.min}
            min={yearDefaults.min}
            max={filters.year_max ?? yearDefaults.max}
            onChange={(e) => {
              const v = clamp(Number(e.target.value || yearDefaults.min), yearDefaults.min, filters.year_max ?? yearDefaults.max);
              setFilters((f) => ({ ...f, year_min: v }));
            }}
          />
          <input
            type="number"
            className="w-1/2 bg-transparent border border-white/20 rounded p-2 text-sm"
            value={filters.year_max ?? yearDefaults.max}
            min={filters.year_min ?? yearDefaults.min}
            max={yearDefaults.max}
            onChange={(e) => {
              const v = clamp(Number(e.target.value || yearDefaults.max), filters.year_min ?? yearDefaults.min, yearDefaults.max);
              setFilters((f) => ({ ...f, year_max: v }));
            }}
          />
        </div>
        <input
          type="range"
          min={yearDefaults.min}
          max={yearDefaults.max}
          step={1}
          value={filters.year_min ?? yearDefaults.min}
          onChange={(e) => {
            const v = Number(e.target.value);
            setFilters((f) => ({ ...f, year_min: Math.min(v, f.year_max ?? yearDefaults.max) }));
          }}
          className="w-full mt-2"
        />
        <input
          type="range"
          min={yearDefaults.min}
          max={yearDefaults.max}
          step={1}
          value={filters.year_max ?? yearDefaults.max}
          onChange={(e) => {
            const v = Number(e.target.value);
            setFilters((f) => ({ ...f, year_max: Math.max(v, f.year_min ?? yearDefaults.min) }));
          }}
          className="w-full -mt-1"
        />
      </div>

      {/* Groupes de specs (Année/Prix retirés côté serveur) */}
      <div className="divide-y divide-white/10 border-t border-white/10">
        {specSchema.map((g) => (
          <details key={g.id} className="py-3">
            <summary className="cursor-pointer text-sm font-semibold">{g.name}</summary>
            <div className="mt-2 space-y-3">
              {g.items.map((it) => {
                if (it.data_type === "numeric") {
                  const rmin = it.range?.min_value ?? 0;
                  const rmax = it.range?.max_value ?? 0;
                  const current = (filters.specs?.[it.id] as any) || {};
                  const vmin = current.min ?? rmin;
                  const vmax = current.max ?? rmax;
                  return (
                    <div key={it.id}>
                      <div className="text-xs opacity-80 mb-1">{it.label}{it.unit ? ` (${it.unit})` : ""}</div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          className="w-1/2 bg-transparent border border-white/20 rounded p-2 text-sm"
                          value={vmin}
                          min={rmin}
                          max={vmax}
                          onChange={(e) => {
                            const v = clamp(Number(e.target.value || rmin), rmin, vmax);
                            setFilters((f) => ({
                              ...f,
                              specs: { ...(f.specs || {}), [it.id]: { ...current, min: v } },
                            }));
                          }}
                        />
                        <input
                          type="number"
                          className="w-1/2 bg-transparent border border-white/20 rounded p-2 text-sm"
                          value={vmax}
                          min={vmin}
                          max={rmax}
                          onChange={(e) => {
                            const v = clamp(Number(e.target.value || rmax), vmin, rmax);
                            setFilters((f) => ({
                              ...f,
                              specs: { ...(f.specs || {}), [it.id]: { ...current, max: v } },
                            }));
                          }}
                        />
                      </div>
                      <input
                        type="range"
                        min={rmin}
                        max={rmax}
                        step={1}
                        value={vmin}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setFilters((f) => ({
                            ...f,
                            specs: { ...(f.specs || {}), [it.id]: { ...current, min: Math.min(v, vmax) } },
                          }));
                        }}
                        className="w-full mt-2"
                      />
                      <input
                        type="range"
                        min={rmin}
                        max={rmax}
                        step={1}
                        value={vmax}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setFilters((f) => ({
                            ...f,
                            specs: { ...(f.specs || {}), [it.id]: { ...current, max: Math.max(v, vmin) } },
                          }));
                        }}
                        className="w-full -mt-1"
                      />
                    </div>
                  );
                } else {
                  const current = (filters.specs?.[it.id] as any) || {};
                  const values: string[] = current.values || [];
                  return (
                    <div key={it.id}>
                      <div className="text-xs opacity-80 mb-1">{it.label}</div>
                      <div className="space-y-1 max-h-40 overflow-auto pr-1">
                        {it.options.map((op) => {
                          const checked = values.includes(op.value);
                          return (
                            <label key={op.value} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? Array.from(new Set([...values, op.value]))
                                    : values.filter((v) => v !== op.value);
                                  setFilters((f) => ({
                                    ...f,
                                    specs: { ...(f.specs || {}), [it.id]: { ...current, values: next } },
                                  }));
                                }}
                              />
                              <span>{op.value}</span>
                              <span className="opacity-60 text-xs">({op.count})</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
