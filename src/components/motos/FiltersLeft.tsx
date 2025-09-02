// src/components/motos/FiltersLeft.tsx
"use client";

import React, { useMemo, useState } from "react";
import RangeSlider from "./RangeSlider";

// --- Types souples pour corriger l'erreur "Type 'Range' is not assignable to '[number, number]'" ---
type RangeTuple = [number, number];
type RangeObj = { min: number; max: number };
type RangeLike = RangeTuple | RangeObj | undefined;

type Brand = any;
type Filters = any;
type SpecGroup = any;

export interface Props {
  brands: Brand[];
  initialF?: string;
  initialFilters?: Filters;
  specSchema?: SpecGroup[];
  /** Accepte soit un tuple [min,max], soit un objet {min,max} */
  priceRange?: RangeLike;
  /** Accepte soit un tuple [min,max], soit un objet {min,max} */
  yearRange?: RangeLike;
}

/** Normalise une valeur de range en tuple [min, max] */
function toTuple(rangeLike: RangeLike): RangeTuple | undefined {
  if (!rangeLike) return undefined;
  if (Array.isArray(rangeLike)) {
    const [a, b] = rangeLike;
    if (typeof a === "number" && typeof b === "number") return [a, b];
    return undefined;
  }
  const r = rangeLike as any;
  if (typeof r.min === "number" && typeof r.max === "number") {
    return [r.min, r.max];
  }
  return undefined;
}

/** borne min/max avec défauts sûrs */
function normalizeRange(rangeLike: RangeLike, fallback: RangeTuple): RangeTuple {
  const t = toTuple(rangeLike);
  if (!t) return fallback;
  // On s'assure que min <= max
  const [a, b] = t[0] <= t[1] ? t : [t[1], t[0]];
  return [a, b];
}

export default function FiltersLeft({
  brands,
  initialF,
  initialFilters,
  specSchema,
  priceRange,
  yearRange,
}: Props) {
  // Défauts raisonnables si rien en base
  const priceDefault = useMemo<RangeTuple>(() => normalizeRange(priceRange, [0, 500_000]), [priceRange]);
  const yearDefault = useMemo<RangeTuple>(() => normalizeRange(yearRange, [1990, new Date().getFullYear() + 1]), [yearRange]);

  // États locaux des sliders (double-poignée)
  const [price, setPrice] = useState<RangeTuple>(priceDefault);
  const [year, setYear] = useState<RangeTuple>(yearDefault);

  // Gap minimal pour éviter que la poignée gauche reste bloquée
  const MIN_GAP_PRICE = Math.max(1, Math.round((priceDefault[1] - priceDefault[0]) / 100)); // 1% du range
  const MIN_GAP_YEAR = 1;

  return (
    <div className="space-y-6">
      {/* Marque */}
      <div>
        <label className="block text-sm font-medium mb-2">Marque</label>
        <select className="w-full border rounded-md p-2">
          <option value="">Toutes</option>
          {brands?.map((b: any) => (
            <option key={b.id ?? b.name} value={b.id ?? b.name}>
              {b.name ?? b.label ?? "?"}
            </option>
          ))}
        </select>
      </div>

      {/* Mot-clé */}
      <div>
        <label className="block text-sm font-medium mb-2">Mot-clé</label>
        <input
          type="text"
          className="w-full border rounded-md p-2"
          placeholder="Ex. 'Adventure', 'MT-07'..."
          defaultValue={initialFilters?.q ?? ""}
        />
      </div>

      {/* Prix */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Prix (TND)</label>
          <span className="text-xs opacity-70">
            {Math.round(price[0]).toLocaleString()} — {Math.round(price[1]).toLocaleString()}
          </span>
        </div>
        <RangeSlider
          min={Math.floor(priceDefault[0])}
          max={Math.ceil(priceDefault[1])}
          step={100}
          minGap={MIN_GAP_PRICE}
          value={price}
          onChange={setPrice}
          ariaLabelMin="Valeur minimale prix"
          ariaLabelMax="Valeur maximale prix"
        />
      </div>

      {/* Année */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Année</label>
          <span className="text-xs opacity-70">
            {Math.round(year[0])} — {Math.round(year[1])}
          </span>
        </div>
        <RangeSlider
          min={Math.floor(yearDefault[0])}
          max={Math.ceil(yearDefault[1])}
          step={1}
          minGap={MIN_GAP_YEAR}
          value={year}
          onChange={setYear}
          ariaLabelMin="Valeur minimale année"
          ariaLabelMax="Valeur maximale année"
        />
      </div>

      {/* Groupes de specs (affichage simple pour compatibilité) */}
      {Array.isArray(specSchema) && specSchema.length > 0 && (
        <div className="divide-y rounded-md border">
          {specSchema.map((g: any) => (
            <div key={g.id ?? g.name} className="p-3">
              <div className="font-semibold mb-2">{g.name ?? "Caractéristiques"}</div>
              {Array.isArray(g.items) && g.items.length > 0 ? (
                <ul className="space-y-1">
                  {g.items.map((it: any) => (
                    <li key={it.id ?? it.label} className="text-sm text-gray-700">
                      • {it.label ?? it.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-gray-500">Aucun sous-filtre</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
