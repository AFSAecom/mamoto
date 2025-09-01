// src/components/motos/FiltersLeft.tsx
"use client";

import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/** ---------- Types ---------- */
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

/** ---------- Utils ---------- */
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

function utoa(json: string) {
  if (typeof window === "undefined") {
    // @ts-ignore
    return Buffer.from(json, "utf8").toString("base64");
  }
  return btoa(unescape(encodeURIComponent(json)));
}
function encodeF(f: { filters: Filters; page: number }) {
  const json = JSON.stringify(f);
  const b64 = utoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return b64;
}
const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();

/** ---------- DualRange (single thick red rail + 2 thumbs) ---------- */
function DualRange({
  domainMin,
  domainMax,
  step = 1,
  valueMin,
  valueMax,
  onChange,
  id,
  "aria-label": ariaLabel,
}: {
  domainMin: number;
  domainMax: number;
  step?: number;
  valueMin: number;
  valueMax: number;
  onChange: (vals: { min: number; max: number }) => void;
  id?: string;
  "aria-label"?: string;
}) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [localMin, setLocalMin] = useState(valueMin);
  const [localMax, setLocalMax] = useState(valueMax);
  const [active, setActive] = useState<"min" | "max" | null>(null);
  const minGap = step; // avoid overlap

  useEffect(() => {
    setLocalMin(clamp(valueMin, domainMin, valueMax));
    setLocalMax(clamp(valueMax, valueMin, domainMax));
  }, [valueMin, valueMax, domainMin, domainMax]);

  const roundToStep = (val: number) => Math.round(val / step) * step;
  const pct = useCallback(
    (v: number) => ((v - domainMin) * 100) / (domainMax - domainMin || 1),
    [domainMin, domainMax]
  );

  const setMin = (v: number) => {
    const val = clamp(roundToStep(v), domainMin, localMax - minGap);
    setLocalMin(val);
    onChange({ min: val, max: Math.max(localMax, val + minGap) });
  };
  const setMax = (v: number) => {
    const val = clamp(roundToStep(v), localMin + minGap, domainMax);
    setLocalMax(val);
    onChange({ min: Math.min(localMin, val - minGap), max: val });
  };

  const onRailClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!railRef.current) return;
    const rect = railRef.current.getBoundingClientRect();
    const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const raw = domainMin + ratio * (domainMax - domainMin);
    const target = roundToStep(raw);
    // move the nearest thumb
    const dMin = Math.abs(target - localMin);
    const dMax = Math.abs(target - localMax);
    if (dMin <= dMax) setMin(target);
    else setMax(target);
  };

  const pMin = pct(localMin);
  const pMax = pct(localMax);

  return (
    <div className="relative h-10 select-none" aria-label={ariaLabel}>
      {/* Thick clickable rail */}
      <div
        ref={railRef}
        className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[14px] rounded-full bg-white/20 cursor-pointer"
        onMouseDown={onRailClick}
      />
      {/* red selected segment */}
      <div
        className="absolute top-1/2 -translate-y-1/2 h-[10px] rounded-full"
        style={{ left: `${pMin}%`, right: `${100 - pMax}%`, background: "#E50019" }}
      />
      {/* min thumb */}
      <input
        id={id ? `${id}-min` : undefined}
        type="range"
        min={domainMin}
        max={domainMax}
        step={step}
        value={localMin}
        onMouseDown={() => setActive("min")}
        onTouchStart={() => setActive("min")}
        onChange={(e) => setMin(Number(e.target.value))}
        className={`range-thumb absolute left-0 right-0 top-1/2 -translate-y-1/2 w-full bg-transparent appearance-none pointer-events-auto ${active==="min" ? "z-20" : "z-10"}`}
      />
      {/* max thumb */}
      <input
        id={id ? `${id}-max` : undefined}
        type="range"
        min={domainMin}
        max={domainMax}
        step={step}
        value={localMax}
        onMouseDown={() => setActive("max")}
        onTouchStart={() => setActive("max")}
        onChange={(e) => setMax(Number(e.target.value))}
        className={`range-thumb absolute left-0 right-0 top-1/2 -translate-y-1/2 w-full bg-transparent appearance-none pointer-events-auto ${active==="max" ? "z-20" : "z-10"}`}
      />
      <style jsx>{`
        .range-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 9999px;
          background: #fff;
          border: 2px solid #E50019;
          box-shadow: 0 0 0 2px rgba(0,0,0,0.15);
          cursor: pointer;
          position: relative;
        }
        .range-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 9999px;
          background: #fff;
          border: 2px solid #E50019;
          box-shadow: 0 0 0 2px rgba(0,0,0,0.15);
          cursor: pointer;
          position: relative;
        }
        .range-thumb::-webkit-slider-runnable-track { background: transparent; height: 18px; }
        .range-thumb::-moz-range-track { background: transparent; height: 18px; }
      `}</style>
    </div>
  );
}

/** ---------- Component ---------- */
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
  priceRange?: Range;   // domain (global) min/max for price
  yearRange?: Range;    // domain (global) min/max for year
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // DOMAIN (toujours le domaine global : ce qui fixe la longueur de la rail)
  const priceDomain: Range = priceRange ?? { min: 0, max: 500000 };
  const yearDomain: Range = yearRange ?? { min: 1990, max: new Date().getFullYear() };

  // VALEURS COURANTES (initialisées aux extrêmes du domaine si non précisées)
  const [filters, setFilters] = useState<Filters>(() => ({
    ...initialFilters,
    price_min: initialFilters.price_min ?? priceDomain.min,
    price_max: initialFilters.price_max ?? priceDomain.max,
    year_min: initialFilters.year_min ?? yearDomain.min,
    year_max: initialFilters.year_max ?? yearDomain.max,
  }));

  // Auto-corriger si un état “serré” (ex: max=190 alors que domaine max=300000)
  useEffect(() => {
    setFilters((f) => ({
      ...f,
      price_min: clamp(f.price_min ?? priceDomain.min, priceDomain.min, priceDomain.max),
      price_max: clamp(f.price_max ?? priceDomain.max, priceDomain.min, priceDomain.max),
      year_min: clamp(f.year_min ?? yearDomain.min, yearDomain.min, yearDomain.max),
      year_max: clamp(f.year_max ?? yearDomain.max, yearDomain.min, yearDomain.max),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceDomain.min, priceDomain.max, yearDomain.min, yearDomain.max]);

  // Pousser dans l’URL
  useEffect(() => {
    const fEnc = encodeF({ filters, page: 0 });
    const q = new URLSearchParams(searchParams?.toString());
    if (fEnc) q.set("f", fEnc);
    router.replace(`/motos?${q.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  /** Forcer certains labels en numériques */
  const forcedNumericLabels = useMemo(() => {
    const must = new Set(["cylindree", "puissance", "nb rapports", "couple"]);
    const ids: string[] = [];
    for (const g of specSchema || []) {
      for (const it of g.items) {
        if (must.has(norm(it.label))) ids.push(it.id);
      }
    }
    return new Set(ids);
  }, [specSchema]);

  const isBooleanLabel = (lbl: string) => {
    const s = norm(lbl);
    return s === "abs" || s.includes("controle de traction") || s.includes("contrôle de traction");
  };

  const numberInput = (val: number, onChange: (v: number) => void) => (
    <input
      type="number"
      className="w-1/2 bg-transparent border border-white/20 rounded p-2 text-sm"
      value={val}
      onChange={(e) => onChange(Number(e.target.value || 0))}
    />
  );

  return (
    <div className="space-y-6">
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

      {/* Prix (domaine global) */}
      <div>
        <div className="text-sm font-semibold mb-2">Prix</div>
        <div className="flex items-center gap-2 mb-2">
          {numberInput(filters.price_min ?? priceDomain.min, (v) =>
            setFilters((f) => ({
              ...f,
              price_min: clamp(v, priceDomain.min, (f.price_max ?? priceDomain.max)),
            }))
          )}
          {numberInput(filters.price_max ?? priceDomain.max, (v) =>
            setFilters((f) => ({
              ...f,
              price_max: clamp(v, (f.price_min ?? priceDomain.min), priceDomain.max),
            }))
          )}
        </div>
        <DualRange
          id="price"
          domainMin={priceDomain.min}
          domainMax={priceDomain.max}
          step={1}
          valueMin={filters.price_min ?? priceDomain.min}
          valueMax={filters.price_max ?? priceDomain.max}
          onChange={({ min, max }) => setFilters((f) => ({ ...f, price_min: min, price_max: max }))}
          aria-label="Plage de prix"
        />
      </div>

      {/* Année (domaine global) */}
      <div>
        <div className="text-sm font-semibold mb-2">Année</div>
        <div className="flex items-center gap-2 mb-2">
          {numberInput(filters.year_min ?? yearDomain.min, (v) =>
            setFilters((f) => ({
              ...f,
              year_min: clamp(v, yearDomain.min, (f.year_max ?? yearDomain.max)),
            }))
          )}
          {numberInput(filters.year_max ?? yearDomain.max, (v) =>
            setFilters((f) => ({
              ...f,
              year_max: clamp(v, (f.year_min ?? yearDomain.min), yearDomain.max),
            }))
          )}
        </div>
        <DualRange
          id="year"
          domainMin={yearDomain.min}
          domainMax={yearDomain.max}
          step={1}
          valueMin={filters.year_min ?? yearDomain.min}
          valueMax={filters.year_max ?? yearDomain.max}
          onChange={({ min, max }) => setFilters((f) => ({ ...f, year_min: min, year_max: max }))}
          aria-label="Plage d'années"
        />
      </div>

      {/* Groupes de specs */}
      <div className="divide-y divide-white/10 border-t border-white/10">
        {(specSchema || []).map((g) => (
          <details key={g.id} className="py-3">
            <summary className="cursor-pointer text-sm font-semibold">{g.name}</summary>
            <div className="mt-3 space-y-4">
              {g.items.map((it) => {
                const isForcedNumeric = forcedNumericLabels.has(it.id);

                // Booleans (ABS / contrôle traction)
                if (isBooleanLabel(it.label)) {
                  const current = (filters.specs?.[it.id] as any) || {};
                  const val: "all" | "yes" | "no" = current.bool ?? "all";
                  return (
                    <div key={it.id}>
                      <div className="text-xs opacity-80 mb-1">{it.label}</div>
                      <div className="flex items-center gap-3 text-sm">
                        {(["all","yes","no"] as const).map(choice => (
                          <label key={choice} className="flex items-center gap-1">
                            <input
                              type="radio"
                              name={`bool-${it.id}`}
                              checked={val === choice}
                              onChange={() => {
                                setFilters((f) => ({
                                  ...f,
                                  specs: { ...(f.specs || {}), [it.id]: { ...current, bool: choice } },
                                }));
                              }}
                            />
                            <span>{choice === "all" ? "Tous" : choice === "yes" ? "Oui" : "Non"}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                }

                const isNumeric = isForcedNumeric || it.data_type === "numeric";
                if (isNumeric) {
                  const rmin = it.range?.min_value ?? null;
                  const rmax = it.range?.max_value ?? null;
                  const current = (filters.specs?.[it.id] as any) || {};
                  const vmin = current.min ?? (rmin ?? 0);
                  const vmax = current.max ?? (rmax ?? (vmin + 1));

                  return (
                    <div key={it.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-xs opacity-80">
                          {it.label}
                          {it.unit ? ` (${it.unit})` : ""}
                        </div>
                        <div className="text-[11px] opacity-60">
                          {rmin !== null && rmax !== null ? `${rmin} → ${rmax}` : "—"}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        {numberInput(vmin, (val) =>
                          setFilters((f) => ({
                            ...f,
                            specs: { ...(f.specs || {}), [it.id]: { ...current, min: val } },
                          }))
                        )}
                        {numberInput(vmax, (val) =>
                          setFilters((f) => ({
                            ...f,
                            specs: { ...(f.specs || {}), [it.id]: { ...current, max: val } },
                          }))
                        )}
                      </div>

                      {rmin !== null && rmax !== null && rmin !== rmax && (
                        <DualRange
                          domainMin={rmin}
                          domainMax={rmax}
                          step={1}
                          valueMin={vmin}
                          valueMax={vmax}
                          onChange={({ min, max }) => {
                            setFilters((f) => ({
                              ...f,
                              specs: { ...(f.specs || {}), [it.id]: { ...current, min, max } },
                            }));
                          }}
                          aria-label={it.label}
                        />
                      )}
                    </div>
                  );
                }

                // Text options (checkboxes) avec counts
                const current = (filters.specs?.[it.id] as any) || {};
                const values: string[] = current.values || [];
                return (
                  <div key={it.id}>
                    <div className="text-xs opacity-80 mb-1">{it.label}</div>
                    <div className="space-y-1 max-h-40 overflow-auto pr-1">
                      {(it.options || []).length === 0 ? (
                        <div className="text-xs opacity-60">—</div>
                      ) : (
                        it.options.map((op) => {
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
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
