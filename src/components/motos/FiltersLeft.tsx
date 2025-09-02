// src/components/motos/FiltersLeft.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  // specs: numeric ranges or string arrays or boolean
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

/** ---------- Small utils ---------- */
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

const norm = (s: string) =>
  (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

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

/** ---------- DualRange (one thick red rail + 2 thumbs) ---------- */
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
  const minGap = Math.max(step, 1);

  // Keep local values synced
  useEffect(() => {
    setLocalMin(clamp(valueMin, domainMin, Math.min(valueMax - minGap, domainMax)));
    setLocalMax(clamp(valueMax, Math.max(valueMin + minGap, domainMin), domainMax));
  }, [valueMin, valueMax, domainMin, domainMax]);

  const roundToStep = (val: number) => Math.round(val / step) * step;
  const pct = useCallback(
    (v: number) => ((v - domainMin) * 100) / (domainMax - domainMin || 1),
    [domainMin, domainMax]
  );

  const setMin = (v: number) => {
    const val = clamp(roundToStep(v), domainMin, Math.min(localMax - minGap, domainMax));
    setLocalMin(val);
    onChange({ min: val, max: Math.max(localMax, val + minGap) });
  };
  const setMax = (v: number) => {
    const val = clamp(roundToStep(v), Math.max(localMin + minGap, domainMin), domainMax);
    setLocalMax(val);
    onChange({ min: Math.min(localMin, val - minGap), max: val });
  };

  const onRailClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!railRef.current) return;
    const rect = railRef.current.getBoundingClientRect();
    const ratio = clamp((e.clientX - rect.left) / (rect.width || 1), 0, 1);
    const raw = domainMin + ratio * (domainMax - domainMin);
    const target = roundToStep(raw);
    // move the closest thumb
    const dMin = Math.abs(target - localMin);
    const dMax = Math.abs(target - localMax);
    if (dMin <= dMax) setMin(target);
    else setMax(target);
  };

  const pMin = pct(localMin);
  const pMax = pct(localMax);

  // Ensure MIN thumb is always easily grabbable
  const zMax = active === "max" ? 50 : 30;
  const zMin = active === "min" ? 60 : 40;

  return (
    <div className="relative h-10 select-none" aria-label={ariaLabel}>
      {/* clickable rail */}
      <div
        ref={railRef}
        className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[14px] rounded-full bg-white/20 cursor-pointer"
        onMouseDown={onRailClick}
      />
      {/* red segment */}
      <div
        className="pointer-events-none absolute top-1/2 -translate-y-1/2 h-[10px] rounded-full"
        style={{ left: `${pMin}%`, right: `${100 - pMax}%`, background: "#E50019" }}
      />
      {/* Max first */}
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
        className="range-thumb absolute left-0 right-0 top-1/2 -translate-y-1/2 w-full bg-transparent appearance-none pointer-events-auto"
        style={{ zIndex: zMax }}
      />
      {/* Min second (above by default) */}
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
        className="range-thumb absolute left-0 right-0 top-1/2 -translate-y-1/2 w-full bg-transparent appearance-none pointer-events-auto"
        style={{ zIndex: zMin }}
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
  priceRange?: Range;
  yearRange?: Range;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Global domains from server
  const priceDomain: Range = priceRange ?? { min: 0, max: 500000 };
  const yearDomain: Range = yearRange ?? { min: 1990, max: new Date().getFullYear() };

  // Init filters (normalize to domains)
  const [filters, setFilters] = useState<Filters>(() => ({
    ...initialFilters,
    price_min: clamp(initialFilters.price_min ?? priceDomain.min, priceDomain.min, priceDomain.max),
    price_max: clamp(initialFilters.price_max ?? priceDomain.max, priceDomain.min, priceDomain.max),
    year_min: clamp(initialFilters.year_min ?? yearDomain.min, yearDomain.min, yearDomain.max - 1),
    year_max: clamp(initialFilters.year_max ?? yearDomain.max, yearDomain.min + 1, yearDomain.max),
    specs: initialFilters.specs ?? {},
  }));

  // Keep in sync if domains change
  useEffect(() => {
    setFilters((f) => ({
      ...f,
      price_min: clamp(f.price_min ?? priceDomain.min, priceDomain.min, priceDomain.max),
      price_max: clamp(f.price_max ?? priceDomain.max, priceDomain.min, priceDomain.max),
      year_min: clamp(f.year_min ?? yearDomain.min, yearDomain.min, yearDomain.max - 1),
      year_max: clamp(f.year_max ?? yearDomain.max, yearDomain.min + 1, yearDomain.max),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceDomain.min, priceDomain.max, yearDomain.min, yearDomain.max]);

  // Push to URL
  useEffect(() => {
    const fEnc = encodeF({ filters, page: 0 });
    const q = new URLSearchParams(searchParams?.toString());
    if (fEnc) q.set("f", fEnc);
    router.replace(`/motos?${q.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Labels to hide (avoid duplicates of Price/Year in "Infos générales")
  const hiddenLabels = useMemo(() => {
    const S = new Set(["prix", "prix tnd", "annee", "année"]);
    return S;
  }, []);

  // Force sliders for some numeric specs
  const forceNumericByLabel = useMemo(() => {
    const S = new Set(["cylindree", "cylindrée", "puissance", "nb rapports", "nombre de rapports", "couple"]);
    return S;
  }, []);

  const isBooleanLabel = (lbl: string) => {
    const s = norm(lbl);
    return s === "abs" || s.includes("controle de traction") || s.includes("contrôle de traction");
  };

  const numberInput = (val: number, onChange: (v: number) => void) => (
    <input
      type="number"
      className="w-1/2 bg-transparent border border-white/20 rounded p-2 text-sm"
      value={Number.isFinite(val as number) ? val : ""}
      onChange={(e) => onChange(Number(e.target.value || 0))}
    />
  );

  /** ---------- Render ---------- */
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

      {/* Prix */}
      <div>
        <div className="text-sm font-semibold mb-2">Prix</div>
        <div className="flex items-center gap-2 mb-2">
          {numberInput(filters.price_min ?? priceDomain.min, (v) =>
            setFilters((f) => ({
              ...f,
              price_min: clamp(v, priceDomain.min, (f.price_max ?? priceDomain.max) - 1),
            }))
          )}
          {numberInput(filters.price_max ?? priceDomain.max, (v) =>
            setFilters((f) => ({
              ...f,
              price_max: clamp(v, (f.price_min ?? priceDomain.min) + 1, priceDomain.max),
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

      {/* Année */}
      <div>
        <div className="text-sm font-semibold mb-2">Année</div>
        <div className="flex items-center gap-2 mb-2">
          {numberInput(filters.year_min ?? yearDomain.min, (v) =>
            setFilters((f) => ({
              ...f,
              year_min: clamp(v, yearDomain.min, (f.year_max ?? yearDomain.max) - 1),
            }))
          )}
          {numberInput(filters.year_max ?? yearDomain.max, (v) =>
            setFilters((f) => ({
              ...f,
              year_max: clamp(v, (f.year_min ?? yearDomain.min) + 1, yearDomain.max),
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

      {/* SPEC GROUPS */}
      {(specSchema ?? []).map((group) => {
        const items = (group.items ?? []).filter((it) => !hiddenLabels.has(norm(it.label)));
        if (items.length === 0) return null;
        return (
          <div key={group.id} className="pt-4 border-t border-white/10">
            <div className="font-semibold text-sm mb-3">{group.name}</div>
            <div className="space-y-4">
              {items.map((item) => {
                const id = item.id;
                const label = item.label;
                const unit = item.unit || "";
                const current = (filters.specs ?? {})[id];

                const hasNumericRange =
                  !!item.range &&
                  Number.isFinite(item.range.min_value as number) &&
                  Number.isFinite(item.range.max_value as number);

                const forceNumeric = forceNumericByLabel.has(norm(label));
                const isBool = isBooleanLabel(label);

                // numeric slider
                if (hasNumericRange || forceNumeric) {
                  const dMin = hasNumericRange ? (item.range!.min_value as number) : 0;
                  const dMax = hasNumericRange ? (item.range!.max_value as number) : 100;
                  const valMin = clamp((current?.min as number) ?? dMin, dMin, dMax);
                  const valMax = clamp((current?.max as number) ?? dMax, dMin, dMax);

                  return (
                    <div key={id}>
                      <div className="text-xs mb-2">{label} {unit ? <span className="opacity-60">({unit})</span> : null}</div>
                      <div className="flex items-center gap-2 mb-2">
                        {numberInput(valMin, (v) =>
                          setFilters((f) => ({
                            ...f,
                            specs: { ...(f.specs ?? {}), [id]: { min: clamp(v, dMin, (valMax ?? dMax) - 1), max: valMax } },
                          }))
                        )}
                        {numberInput(valMax, (v) =>
                          setFilters((f) => ({
                            ...f,
                            specs: { ...(f.specs ?? {}), [id]: { min: valMin, max: clamp(v, (valMin ?? dMin) + 1, dMax) } },
                          }))
                        )}
                      </div>
                      <DualRange
                        id={`spec-${id}`}
                        domainMin={dMin}
                        domainMax={dMax}
                        step={1}
                        valueMin={valMin}
                        valueMax={valMax}
                        onChange={({ min, max }) =>
                          setFilters((f) => ({ ...f, specs: { ...(f.specs ?? {}), [id]: { min, max } } }))
                        }
                        aria-label={`Plage ${label}`}
                      />
                    </div>
                  );
                }

                // boolean → tri-state
                if (isBool) {
                  const v = current;
                  const val: "all" | "yes" | "no" =
                    v === true ? "yes" : v === false ? "no" : "all";
                  const setVal = (nv: "all" | "yes" | "no") =>
                    setFilters((f) => ({
                      ...f,
                      specs: {
                        ...(f.specs ?? {}),
                        [id]: nv === "all" ? undefined : nv === "yes" ? true : false,
                      },
                    }));
                  return (
                    <div key={id}>
                      <div className="text-xs mb-2">{label}</div>
                      <div className="flex gap-3 text-sm">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            checked={val === "all"}
                            onChange={() => setVal("all")}
                          />
                          Tous
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            checked={val === "yes"}
                            onChange={() => setVal("yes")}
                          />
                          Oui
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            checked={val === "no"}
                            onChange={() => setVal("no")}
                          />
                          Non
                        </label>
                      </div>
                    </div>
                  );
                }

                // options (checkboxes)
                if ((item.options ?? []).length > 0) {
                  const selected: string[] = Array.isArray(current) ? current : [];
                  const toggle = (opt: string) => {
                    const has = selected.includes(opt);
                    const next = has ? selected.filter((x) => x !== opt) : [...selected, opt];
                    setFilters((f) => ({
                      ...f,
                      specs: { ...(f.specs ?? {}), [id]: next.length ? next : undefined },
                    }));
                  };
                  return (
                    <div key={id}>
                      <div className="text-xs mb-2">{label}</div>
                      <div className="max-h-40 overflow-auto pr-1 space-y-1">
                        {(item.options ?? []).map((opt) => (
                          <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selected.includes(opt.value)}
                              onChange={() => toggle(opt.value)}
                            />
                            <span>
                              {opt.value}{" "}
                              <span className="opacity-50 text-xs">({opt.count})</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                }

                // default: empty
                return (
                  <div key={id}>
                    <div className="text-xs mb-2">{label}</div>
                    <div className="opacity-50 text-sm">—</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
