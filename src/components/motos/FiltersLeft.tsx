// src/components/motos/FiltersLeft.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
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
type SpecSchema = {
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

function encodeF(f: { filters: Filters; page: number }) {
  const json = JSON.stringify(f);
  const b64 = Buffer.from(json, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return b64;
}
function decodeF(fRaw?: string | null): { filters: Filters; page: number } {
  if (!fRaw) return { filters: {}, page: 0 };
  try {
    const pad = fRaw.length % 4 ? "=".repeat(4 - (fRaw.length % 4)) : "";
    const std = fRaw.replace(/-/g, "+").replace(/_/g, "/") + pad;
    const json = Buffer.from(std, "base64").toString("utf8");
    const v = JSON.parse(json);
    return { filters: v.filters || {}, page: typeof v.page === "number" ? v.page : 0 };
  } catch {
    return { filters: {}, page: 0 };
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function FiltersLeft({
  brands,
  initialF,
  initialFilters,
  specSchema,
  priceRange,
  yearRange,
}: {
  brands: Brand[];
  initialF: string;
  initialFilters: Filters;
  specSchema: SpecSchema[];
  priceRange: Range;
  yearRange: Range;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<Filters>(() => ({
    ...initialFilters,
  }));

  // Valeurs par défaut dynamiques (si non définies dans l'URL)
  const priceMin = filters.price_min ?? priceRange.min;
  const priceMax = filters.price_max ?? priceRange.max;
  const yearMin = filters.year_min ?? yearRange.min;
  const yearMax = filters.year_max ?? yearRange.max;

  // Sync URL à chaque modification
  useEffect(() => {
    const fEnc = encodeF({ filters, page: 0 });
    const q = new URLSearchParams(searchParams?.toString());
    if (fEnc) q.set("f", fEnc);
    router.replace(`/motos?${q.toString()}`);
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

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

      {/* Prix */}
      <div>
        <div className="text-sm font-semibold mb-1">Prix</div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            className="w-1/2 bg-transparent border border-white/20 rounded p-2 text-sm"
            value={priceMin}
            min={priceRange.min}
            max={priceRange.max}
            onChange={(e) => {
              const v = clamp(Number(e.target.value || priceRange.min), priceRange.min, priceMax);
              setFilters((f) => ({ ...f, price_min: v }));
            }}
          />
          <input
            type="number"
            className="w-1/2 bg-transparent border border-white/20 rounded p-2 text-sm"
            value={priceMax}
            min={priceMin}
            max={priceRange.max}
            onChange={(e) => {
              const v = clamp(Number(e.target.value || priceRange.max), priceMin, priceRange.max);
              setFilters((f) => ({ ...f, price_max: v }));
            }}
          />
        </div>
        <input
          type="range"
          min={priceRange.min}
          max={priceRange.max}
          step={100}
          value={priceMin}
          onChange={(e) => {
            const v = Number(e.target.value);
            setFilters((f) => ({ ...f, price_min: Math.min(v, f.price_max ?? priceRange.max) }));
          }}
          className="w-full mt-2"
        />
        <input
          type="range"
          min={priceRange.min}
          max={priceRange.max}
          step={100}
          value={priceMax}
          onChange={(e) => {
            const v = Number(e.target.value);
            setFilters((f) => ({ ...f, price_max: Math.max(v, f.price_min ?? priceRange.min) }));
          }}
          className="w-full -mt-1"
        />
      </div>

      {/* Année */}
      <div>
        <div className="text-sm font-semibold mb-1">Année</div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            className="w-1/2 bg-transparent border border-white/20 rounded p-2 text-sm"
            value={yearMin}
            min={yearRange.min}
            max={yearRange.max}
            onChange={(e) => {
              const v = clamp(Number(e.target.value || yearRange.min), yearRange.min, yearMax);
              setFilters((f) => ({ ...f, year_min: v }));
            }}
          />
          <input
            type="number"
            className="w-1/2 bg-transparent border border-white/20 rounded p-2 text-sm"
            value={yearMax}
            min={yearMin}
            max={yearRange.max}
            onChange={(e) => {
              const v = clamp(Number(e.target.value || yearRange.max), yearMin, yearRange.max);
              setFilters((f) => ({ ...f, year_max: v }));
            }}
          />
        </div>
        <input
          type="range"
          min={yearRange.min}
          max={yearRange.max}
          step={1}
          value={yearMin}
          onChange={(e) => {
            const v = Number(e.target.value);
            setFilters((f) => ({ ...f, year_min: Math.min(v, f.year_max ?? yearRange.max) }));
          }}
          className="w-full mt-2"
        />
        <input
          type="range"
          min={yearRange.min}
          max={yearRange.max}
          step={1}
          value={yearMax}
          onChange={(e) => {
            const v = Number(e.target.value);
            setFilters((f) => ({ ...f, year_max: Math.max(v, f.year_min ?? yearRange.min) }));
          }}
          className="w-full -mt-1"
        />
      </div>

      {/* Groupes de specs (Année/Prix ont été retirés côté serveur) */}
      <div className="divide-y divide-white/10 border-t border-white/10">
        {specSchema.map((g) => (
          <details key={g.id} className="py-3" open={false}>
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
