// src/components/motos/FiltersLeft.tsx
"use client";

import React, { useEffect, useState } from "react";
import RangeSlider, { RangeTuple } from "./RangeSlider";
import { createClient } from "@supabase/supabase-js";

type Brand = { id: string; name: string };
type TextOption = { id?: string; value?: string; label?: string; name?: string };
type NumericRangeRow = { min: number | null; max: number | null; step?: number | null };
type SpecItem = {
  id: string;
  label: string;
  data_type: "number" | "text" | "boolean";
  unit?: string | null;
  range?: NumericRangeRow | null;
  options?: TextOption[];
};
type SpecGroup = { id: string; name: string; items: SpecItem[] };
type Filters = {
  keyword?: string;
  brandId?: string | null;
  price?: RangeTuple;
  year?: RangeTuple;
  specs?: Record<string, any>;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function labelOf(opt?: TextOption | null): string {
  if (!opt) return "";
  return (
    (opt.label ?? "").toString() ||
    (opt.name ?? "").toString() ||
    (opt.value ?? "").toString()
  );
}
function ensureTuple(v?: RangeTuple, fallback: RangeTuple = [0, 1]): RangeTuple {
  if (!v || !Array.isArray(v) || v.length !== 2) return fallback;
  const a = Number(v[0]);
  const b = Number(v[1]);
  if (Number.isNaN(a) || Number.isNaN(b)) return fallback;
  return a <= b ? [a, b] : [b, a];
}

type Props = {
  brands: Brand[];
  initialF?: string;
  initialFilters?: Filters;
  specSchema?: SpecGroup[];
  onFiltersChange?: (f: Filters) => void;
  /** Optionnel — laissé pour compat Vercel : sera ignoré si absent */
  priceRange?: RangeTuple;
  /** Optionnel — laissé pour compat Vercel : sera ignoré si absent */
  yearRange?: RangeTuple;
};

export default function FiltersLeft({
  brands,
  initialFilters,
  specSchema = [],
  onFiltersChange,
  priceRange,
  yearRange,
}: Props) {
  const [filters, setFilters] = useState<Filters>(() => ({
    brandId: initialFilters?.brandId ?? null,
    keyword: initialFilters?.keyword ?? "",
    price: ensureTuple(initialFilters?.price, priceRange ?? [0, 1]),
    year: ensureTuple(initialFilters?.year, yearRange ?? [2000, 2001]),
    specs: initialFilters?.specs ?? {},
  }));

  // Si les ranges sont fournis par le parent, on les prend en priorité
  const [priceMinMax, setPriceMinMax] = useState<RangeTuple>(
    priceRange ?? [0, 500000]
  );
  const [yearMinMax, setYearMinMax] = useState<RangeTuple>(
    yearRange ?? [2000, new Date().getFullYear()]
  );

  // Fetch fallback uniquement si le parent ne les a pas fournis
  useEffect(() => {
    let ignore = false;
    if (priceRange && yearRange) {
      // Parent already provided values; sync filters with them just in case
      setPriceMinMax(priceRange);
      setYearMinMax(yearRange);
      setFilters((prev) => ({
        ...prev,
        price: ensureTuple(prev.price, priceRange),
        year: ensureTuple(prev.year, yearRange),
      }));
      return;
    }
    (async () => {
      const { data: pMin } = await supabase
        .from("motos")
        .select("price")
        .order("price", { ascending: true })
        .limit(1);
      const { data: pMax } = await supabase
        .from("motos")
        .select("price")
        .order("price", { ascending: false })
        .limit(1);
      const { data: yMin } = await supabase
        .from("motos")
        .select("year")
        .order("year", { ascending: true })
        .limit(1);
      const { data: yMax } = await supabase
        .from("motos")
        .select("year")
        .order("year", { ascending: false })
        .limit(1);

      const p0 = Number(pMin?.[0]?.price ?? 0);
      const p1 = Number(pMax?.[0]?.price ?? 500000);
      const y0 = Number(yMin?.[0]?.year ?? 2000);
      const y1 = Number(yMax?.[0]?.year ?? new Date().getFullYear());

      if (!ignore) {
        const priceR: RangeTuple = [Math.min(p0, p1), Math.max(p0, p1)];
        const yearR: RangeTuple = [Math.min(y0, y1), Math.max(y0, y1)];
        setPriceMinMax(priceR);
        setYearMinMax(yearR);
        setFilters((prev) => ({
          ...prev,
          price: ensureTuple(prev.price, priceR),
          year: ensureTuple(prev.year, yearR),
        }));
      }
    })();
    return () => {
      ignore = true;
    };
  }, [priceRange, yearRange]);

  useEffect(() => {
    onFiltersChange?.(filters);
  }, [filters, onFiltersChange]);

  const setPrice = (tuple: RangeTuple) => setFilters((f) => ({ ...f, price: tuple }));
  const setYear = (tuple: RangeTuple) => setFilters((f) => ({ ...f, year: tuple }));
  const setSpecRange = (specId: string, tuple: RangeTuple) =>
    setFilters((f) => ({ ...f, specs: { ...f.specs, [specId]: tuple } }));
  const toggleSpecValue = (specId: string, value: string, on: boolean) =>
    setFilters((f) => {
      const prevArr: string[] = Array.isArray(f.specs?.[specId]) ? f.specs![specId] : [];
      const nextArr = on ? Array.from(new Set([...prevArr, value])) : prevArr.filter((v) => v !== value);
      return { ...f, specs: { ...f.specs, [specId]: nextArr } };
    });
  const setBoolean = (specId: string, v: boolean | null) =>
    setFilters((f) => ({ ...f, specs: { ...f.specs, [specId]: v } }));

  const renderNumeric = (it: SpecItem) => {
    const r = it.range ?? { min: 0, max: 1, step: 1 };
    const min = Number(r.min ?? 0);
    const max = Number(r.max ?? 1);
    const step = Number(r.step ?? 1);
    const current = ensureTuple(filters.specs?.[it.id], [min, max]);

    return (
      <div key={it.id} className="mb-4">
        <div className="flex items-center justify-between mb-1 text-sm">
          <span>{it.label}{it.unit ? ` (${it.unit})` : ""}</span>
          <span className="text-xs text-slate-400">
            {current[0]} – {current[1]}
          </span>
        </div>
        <RangeSlider
          min={min}
          max={max}
          step={step}
          minGap={step}
          value={current}
          onChange={(next) => setSpecRange(it.id, next)}
          ariaLabelMin={`${it.label} min`}
          ariaLabelMax={`${it.label} max`}
        />
      </div>
    );
  };

  const renderText = (it: SpecItem) => {
    const selected: string[] = Array.isArray(filters.specs?.[it.id]) ? filters.specs![it.id] : [];
    const options = (it.options ?? []).map((o) => ({
      key: o.id ?? o.value ?? labelOf(o),
      value: (o.value ?? labelOf(o)) as string,
      label: labelOf(o),
    }));
    return (
      <div key={it.id} className="mb-3">
        <div className="mb-2 text-sm font-medium">{it.label}</div>
        <div className="max-h-40 overflow-auto pr-1 space-y-2">
          {options.length === 0 ? (
            <div className="text-xs text-slate-400">—</div>
          ) : (
            options.map((opt) => (
              <label key={opt.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="accent-red-600"
                  checked={selected.includes(opt.value)}
                  onChange={(e) => toggleSpecValue(it.id, opt.value!, e.target.checked)}
                />
                <span>{opt.label || opt.value}</span>
              </label>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderBoolean = (it: SpecItem) => {
    const val: boolean | null = (filters.specs?.[it.id] ?? null) as any;
    return (
      <div key={it.id} className="mb-3">
        <div className="mb-2 text-sm font-medium">{it.label}</div>
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name={`bool-${it.id}`}
              checked={val === null}
              onChange={() => setBoolean(it.id, null)}
            />
            Tous
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name={`bool-${it.id}`}
              checked={val === true}
              onChange={() => setBoolean(it.id, true)}
            />
            Oui
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name={`bool-${it.id}`}
              checked={val === false}
              onChange={() => setBoolean(it.id, false)}
            />
            Non
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <label className="block text-sm mb-1">Toutes marques</label>
        <select
          className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
          value={filters.brandId ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, brandId: e.target.value || null }))}
        >
          <option value="">Toutes marques</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm mb-1">Mots clefs</label>
        <input
          placeholder="Rechercher"
          className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
          value={filters.keyword ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
        />
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between text-sm mb-1">
          <span>Prix</span>
          <span className="text-xs text-slate-400">
            {filters.price?.[0]} – {filters.price?.[1]} DT
          </span>
        </div>
        <RangeSlider
          min={priceMinMax[0]}
          max={priceMinMax[1]}
          step={1}
          minGap={1}
          value={ensureTuple(filters.price, priceMinMax)}
          onChange={setPrice}
          ariaLabelMin="Prix min"
          ariaLabelMax="Prix max"
        />
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-1">
          <span>Année</span>
          <span className="text-xs text-slate-400">
            {filters.year?.[0]} – {filters.year?.[1]}
          </span>
        </div>
        <RangeSlider
          min={yearMinMax[0]}
          max={yearMinMax[1]}
          step={1}
          minGap={1}
          value={ensureTuple(filters.year, yearMinMax)}
          onChange={setYear}
          ariaLabelMin="Année min"
          ariaLabelMax="Année max"
        />
      </div>

      {specSchema.map((group) => {
        const items = group.items.filter(
          (it) => !/^(année|annee|price|prix)$/i.test(it.label.trim())
        );
        if (items.length === 0) return null;

        return (
          <details key={group.id} className="mb-5" open>
            <summary className="cursor-pointer text-sm font-semibold mb-2">
              {group.name}
            </summary>
            {items.map((it) => {
              if (it.data_type === "number" && it.range) return renderNumeric(it);
              if (it.data_type === "text") return renderText(it);
              if (it.data_type === "boolean") return renderBoolean(it);
              return null;
            })}
          </details>
        );
      })}
    </div>
  );
}
