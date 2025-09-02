// src/components/motos/FiltersLeft.tsx
"use client";

import React, { useMemo, useState } from "react";
import RangeSlider from "./RangeSlider";

// ---- Types minimales pour éviter les erreurs de build ----
type Brand = { id: string; name: string };

type RangeTuple = [number, number];
type RangeObj = { min: number; max: number };
type Range = RangeTuple | RangeObj;

type SpecOption = { value: string; label?: string };
type NumericRangeRow = { min: number; max: number; step?: number | null };

type SpecItem = {
  id: string;
  label: string;
  unit?: string | null;
  data_type: "number" | "enum" | "boolean" | "text";
  range?: NumericRangeRow | null;
  options?: SpecOption[];
};

type SpecGroup = {
  id: string;
  name: string;
  items: SpecItem[];
};

type Filters = Record<string, unknown>;

type Props = {
  brands: Brand[];
  initialF?: string;
  initialFilters?: Filters;
  specSchema?: SpecGroup[];
  /** ⬅️ Large tolérance : accepte tuple OU objet {min,max} */
  priceRange?: Range;
  yearRange?: Range;
};

// Utilitaire : normalise range en tuple
function toTuple(r?: Range): RangeTuple {
  if (!r) return [0, 0];
  if (Array.isArray(r)) return [r[0] ?? 0, r[1] ?? 0];
  return [r.min ?? 0, r.max ?? 0];
}

export default function FiltersLeft({
  brands,
  initialF = "",
  initialFilters = {},
  specSchema = [],
  priceRange,
  yearRange,
}: Props) {
  // États UI (ou dérivés des props)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const pTuple = useMemo(() => toTuple(priceRange), [priceRange]);
  const yTuple = useMemo(() => toTuple(yearRange), [yearRange]);

  // Pour la démo, on conserve la valeur courante côté client
  const [price, setPrice] = useState<RangeTuple>(pTuple);
  const [year, setYear] = useState<RangeTuple>(yTuple);

  const toggle = (id: string) =>
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="w-full space-y-6">
      {/* Marque */}
      <div className="space-y-2">
        <div className="text-sm font-semibold uppercase tracking-wide text-gray-600">
          Marque
        </div>
        <select
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          defaultValue=""
        >
          <option value="">Toutes</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* Mot-clé */}
      <div className="space-y-2">
        <div className="text-sm font-semibold uppercase tracking-wide text-gray-600">
          Mot-clé
        </div>
        <input
          type="text"
          placeholder="Rechercher..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          defaultValue=""
        />
      </div>

      {/* Prix */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold uppercase tracking-wide text-gray-600">
            Prix
          </div>
          <div className="text-xs text-gray-500">
            {price[0].toLocaleString()} – {price[1].toLocaleString()} TND
          </div>
        </div>
        <RangeSlider
          min={pTuple[0]}
          max={pTuple[1]}
          step={1000}
          minGap={1000}
          value={price}
          onChange={setPrice}
          ariaLabelMin="Prix minimum"
          ariaLabelMax="Prix maximum"
        />
      </div>

      {/* Année */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold uppercase tracking-wide text-gray-600">
            Année
          </div>
          <div className="text-xs text-gray-500">
            {year[0]} – {year[1]}
          </div>
        </div>
        <RangeSlider
          min={yTuple[0]}
          max={yTuple[1]}
          step={1}
          minGap={1}
          value={year}
          onChange={setYear}
          ariaLabelMin="Année minimum"
          ariaLabelMax="Année maximum"
        />
      </div>

      {/* Groupes de specs */}
      {specSchema.map((group) => (
        <div key={group.id} className="border-t pt-4">
          <button
            type="button"
            onClick={() => toggle(group.id)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="font-semibold">{group.name}</span>
            <span className="text-sm text-gray-500">
              {openGroups[group.id] ? "–" : "+"}
            </span>
          </button>

          {openGroups[group.id] && (
            <div className="mt-3 space-y-4 pl-2">
              {group.items.map((it) => {
                if (it.data_type === "number" && it.range) {
                  const r: RangeTuple = [it.range.min, it.range.max];
                  const [cur, setCur] = useState<RangeTuple>(r);
                  return (
                    <div key={it.id}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span>{it.label}</span>
                        <span className="text-xs text-gray-500">
                          {cur[0]} – {cur[1]} {it.unit ?? ""}
                        </span>
                      </div>
                      <RangeSlider
                        min={r[0]}
                        max={r[1]}
                        step={Math.max(1, Math.floor((r[1] - r[0]) / 100))}
                        minGap={1}
                        value={cur}
                        onChange={setCur}
                        ariaLabelMin={`${it.label} min`}
                        ariaLabelMax={`${it.label} max`}
                      />
                    </div>
                  );
                }

                if (it.data_type === "enum" && it.options?.length) {
                  return (
                    <div key={it.id}>
                      <div className="mb-1 text-sm">{it.label}</div>
                      <div className="grid grid-cols-2 gap-2">
                        {it.options.map((op) => (
                          <label
                            key={op.value}
                            className="flex items-center gap-2 text-sm"
                          >
                            <input type="checkbox" className="h-4 w-4" />
                            <span>{op.label ?? op.value}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                }

                if (it.data_type === "boolean") {
                  return (
                    <label key={it.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="h-4 w-4" />
                      <span>{it.label}</span>
                    </label>
                  );
                }

                // texte / fallback
                return (
                  <div key={it.id} className="text-sm text-gray-500">
                    {it.label}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
