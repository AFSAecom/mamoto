// src/components/motos/FiltersLeft.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import RangeSlider from "./RangeSlider";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// --- Types (kept minimal & compatible with your current code) ---
export type Brand = { id: string; name: string };
export type Range = { min: number; max: number };
export type SpecOption = { value: string; label: string; count?: number };
export type NumericRangeRow = { min: number; max: number; step?: number };
export type SpecItem = {
  id: string;
  label: string;
  unit: string | null;
  data_type: string; // "number" | "bool" | "text" | ...
  range: NumericRangeRow | null;
  options: SpecOption[];
};
export type SpecGroup = { id: string; name: string; items: SpecItem[] };

export type Filters = {
  brandId?: string | null;
  q?: string;
  price?: [number, number];
  year?: [number, number];
  specs?: Record<string, any>;
};

type Props = {
  brands: Brand[];
  initialF?: string;
  initialFilters?: Filters;
  specSchema?: SpecGroup[];
  priceRange?: Range;
  yearRange?: Range;
};

// --- helpers to (de)serialise the "f=" param safely (URL safe base64) ---
function encodeF(obj: any): string {
  try {
    const raw = JSON.stringify(obj);
    const b64 = typeof window === "undefined"
      ? Buffer.from(raw).toString("base64")
      : btoa(unescape(encodeURIComponent(raw)));
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  } catch {
    return "";
  }
}

export default function FiltersLeft({
  brands,
  initialF = "",
  initialFilters,
  specSchema = [],
  priceRange,
  yearRange,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rangesGlobal = useMemo(() => ({
    price: priceRange ?? { min: 0, max: 500000 },
    year: yearRange ?? { min: 1990, max: new Date().getFullYear() },
  }), [priceRange, yearRange]);

  const [filters, setFilters] = useState<Filters>(() => ({
    brandId: initialFilters?.brandId ?? null,
    q: initialFilters?.q ?? "",
    price: initialFilters?.price ?? [rangesGlobal.price.min, rangesGlobal.price.max],
    year: initialFilters?.year ?? [rangesGlobal.year.min, rangesGlobal.year.max],
    specs: initialFilters?.specs ?? {},
  }));

  useEffect(() => {
    // sécurise les tableaux par rapport aux bornes connues
    const clampTuple = (t: [number, number], r: Range): [number, number] => {
      const low = Math.max(r.min, Math.min(r.max, t[0]));
      const high = Math.max(low, Math.min(r.max, t[1]));
      return [low, high];
    };
    setFilters((f) => ({
      ...f,
      price: clampTuple(f.price ?? [rangesGlobal.price.min, rangesGlobal.price.max], rangesGlobal.price),
      year: clampTuple(f.year ?? [rangesGlobal.year.min, rangesGlobal.year.max], rangesGlobal.year),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangesGlobal.price.min, rangesGlobal.price.max, rangesGlobal.year.min, rangesGlobal.year.max]);

  // Push URL on every filters change (debounced by React batching)
  useEffect(() => {
    const f = encodeF(filters);
    const params = new URLSearchParams(searchParams?.toString());
    if (f) params.set("f", f); else params.delete("f");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [filters, pathname, router, searchParams]);

  const setSpecRange = (specId: string, next: [number, number]) => {
    setFilters((f) => ({
      ...f,
      specs: { ...(f.specs ?? {}), [specId]: { type: "range", value: next } },
    }));
  };

  const setSpecCheck = (specId: string, option: string, checked: boolean) => {
    setFilters((f) => {
      const prev = ((f.specs ?? {})[specId]?.value as string[]) ?? [];
      const next = checked ? Array.from(new Set([...prev, option])) : prev.filter((v) => v !== option);
      return { ...f, specs: { ...(f.specs ?? {}), [specId]: { type: "options", value: next } } };
    });
  };

  const setSpecBool = (specId: string, v: "all" | "yes" | "no") => {
    setFilters((f) => ({
      ...f,
      specs: { ...(f.specs ?? {}), [specId]: { type: "bool", value: v } },
    }));
  };

  // --- UI helpers ---
  const InputNumber: React.FC<{
    value: number;
    onChange: (n: number) => void;
    min?: number;
    max?: number;
    step?: number;
  }> = ({ value, onChange, min, max, step }) => {
    return (
      <input
        type="number"
        className="w-full rounded-md bg-neutral-800 border border-neutral-600 px-2 py-1 text-sm"
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isFinite(n)) return;
          if (min !== undefined && n < min) onChange(min);
          else if (max !== undefined && n > max) onChange(max);
          else onChange(n);
        }}
        min={min}
        max={max}
        step={step ?? 1}
      />
    );
  };

  const renderNumericItem = (it: SpecItem) => {
    if (!it.range) return null;
    const r = it.range;
    const current: [number, number] =
      (filters.specs?.[it.id]?.value as [number, number]) ?? [r.min, r.max];
    const step = r.step && r.step > 0 ? r.step : (r.max - r.min <= 10 ? 0.1 : 1);
    const minGap = step; // prevents overlap

    return (
      <div key={it.id} className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <InputNumber
            value={current[0]}
            onChange={(n) => {
              const low = Math.max(r.min, Math.min(n, current[1] - minGap));
              setSpecRange(it.id, [low, current[1]]);
            }}
            min={r.min}
            max={r.max}
            step={step}
          />
          <InputNumber
            value={current[1]}
            onChange={(n) => {
              const high = Math.min(r.max, Math.max(n, current[0] + minGap));
              setSpecRange(it.id, [current[0], high]);
            }}
            min={r.min}
            max={r.max}
            step={step}
          />
        </div>
        <RangeSlider
          min={r.min}
          max={r.max}
          step={step}
          minGap={minGap}
          value={current}
          onChange={(next) => setSpecRange(it.id, next)}
          ariaLabel={it.label}
        />
      </div>
    );
  };

  const renderOptionsItem = (it: SpecItem) => {
    if (!it.options || it.options.length === 0) return null;
    const selected: string[] = (filters.specs?.[it.id]?.value as string[]) ?? [];
    return (
      <div key={it.id} className="space-y-2 max-h-44 overflow-auto pr-1">
        {it.options.map((op) => {
          const checked = selected.includes(op.value);
          return (
            <label key={op.value} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-red-600"
                checked={checked}
                onChange={(e) => setSpecCheck(it.id, op.value, e.target.checked)}
              />
              <span className="flex-1">{op.label}</span>
              {typeof op.count === "number" ? (
                <span className="text-neutral-400">({op.count})</span>
              ) : null}
            </label>
          );
        })}
      </div>
    );
  };

  const renderBoolItem = (it: SpecItem) => {
    const v: "all" | "yes" | "no" = (filters.specs?.[it.id]?.value as any) ?? "all";
    return (
      <div key={it.id} className="flex items-center gap-4 text-sm">
        {(["all", "yes", "no"] as const).map((k) => (
          <label key={k} className="inline-flex items-center gap-2">
            <input
              type="radio"
              className="accent-red-600"
              name={`b-${it.id}`}
              checked={v === k}
              onChange={() => setSpecBool(it.id, k)}
            />
            <span>
              {k === "all" ? "Tous" : k === "yes" ? "Oui" : "Non"}
            </span>
          </label>
        ))}
      </div>
    );
  };

  const Group: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    const [open, setOpen] = useState(true);
    return (
      <div className="border-b border-neutral-700 py-3">
        <button
          className="w-full text-left font-medium text-neutral-100 flex items-center justify-between"
          onClick={() => setOpen((o) => !o)}
        >
          <span>{title}</span>
          <span className="text-neutral-400">{open ? "▾" : "▸"}</span>
        </button>
        {open ? <div className="mt-3 space-y-4">{children}</div> : null}
      </div>
    );
  };

  // --- RENDER ---
  return (
    <div className="w-full max-w-sm pr-4">
      {/* Marque */}
      <Group title="Toutes marques">
        <select
          className="w-full rounded-md bg-neutral-800 border border-neutral-600 px-3 py-2 text-sm"
          value={filters.brandId ?? ""}
          onChange={(e) => setFilters({ ...filters, brandId: e.target.value || null })}
        >
          <option value="">Toutes marques</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </Group>

      {/* Mots clefs */}
      <Group title="Mots clefs">
        <input
          type="text"
          placeholder="Rechercher"
          className="w-full rounded-md bg-neutral-800 border border-neutral-600 px-3 py-2 text-sm"
          value={filters.q ?? ""}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
        />
      </Group>

      {/* Prix */}
      <Group title="Prix">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            className="w-full rounded-md bg-neutral-800 border border-neutral-600 px-2 py-1 text-sm"
            value={filters.price?.[0] ?? rangesGlobal.price.min}
            onChange={(e) => {
              const n = Number(e.target.value || rangesGlobal.price.min);
              const low = Math.max(rangesGlobal.price.min, Math.min(n, (filters.price?.[1] ?? rangesGlobal.price.max) - 1));
              setFilters((f) => ({ ...f, price: [low, f.price?.[1] ?? rangesGlobal.price.max] }));
            }}
            min={rangesGlobal.price.min}
            max={rangesGlobal.price.max}
          />
          <input
            type="number"
            className="w-full rounded-md bg-neutral-800 border border-neutral-600 px-2 py-1 text-sm"
            value={filters.price?.[1] ?? rangesGlobal.price.max}
            onChange={(e) => {
              const n = Number(e.target.value || rangesGlobal.price.max);
              const high = Math.min(rangesGlobal.price.max, Math.max(n, (filters.price?.[0] ?? rangesGlobal.price.min) + 1));
              setFilters((f) => ({ ...f, price: [f.price?.[0] ?? rangesGlobal.price.min, high] }));
            }}
            min={rangesGlobal.price.min}
            max={rangesGlobal.price.max}
          />
        </div>
        <RangeSlider
          min={rangesGlobal.price.min}
          max={rangesGlobal.price.max}
          value={[filters.price?.[0] ?? rangesGlobal.price.min, filters.price?.[1] ?? rangesGlobal.price.max]}
          onChange={(next) => setFilters((f) => ({ ...f, price: next }))}
          minGap={1}
          ariaLabel="Prix"
        />
      </Group>

      {/* Année */}
      <Group title="Année">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            className="w-full rounded-md bg-neutral-800 border border-neutral-600 px-2 py-1 text-sm"
            value={filters.year?.[0] ?? rangesGlobal.year.min}
            onChange={(e) => {
              const n = Number(e.target.value || rangesGlobal.year.min);
              const low = Math.max(rangesGlobal.year.min, Math.min(n, (filters.year?.[1] ?? rangesGlobal.year.max) - 1));
              setFilters((f) => ({ ...f, year: [low, f.year?.[1] ?? rangesGlobal.year.max] }));
            }}
            min={rangesGlobal.year.min}
            max={rangesGlobal.year.max}
            step={1}
          />
          <input
            type="number"
            className="w-full rounded-md bg-neutral-800 border border-neutral-600 px-2 py-1 text-sm"
            value={filters.year?.[1] ?? rangesGlobal.year.max}
            onChange={(e) => {
              const n = Number(e.target.value || rangesGlobal.year.max);
              const high = Math.min(rangesGlobal.year.max, Math.max(n, (filters.year?.[0] ?? rangesGlobal.year.min) + 1));
              setFilters((f) => ({ ...f, year: [f.year?.[0] ?? rangesGlobal.year.min, high] }));
            }}
            min={rangesGlobal.year.min}
            max={rangesGlobal.year.max}
            step={1}
          />
        </div>
        <RangeSlider
          min={rangesGlobal.year.min}
          max={rangesGlobal.year.max}
          value={[filters.year?.[0] ?? rangesGlobal.year.min, filters.year?.[1] ?? rangesGlobal.year.max]}
          onChange={(next) => setFilters((f) => ({ ...f, year: next }))}
          minGap={1}
          step={1}
          ariaLabel="Année"
        />
      </Group>

      {/* Groupes spécifications */}
      {specSchema.map((g) => {
        // Filtre : on retire "Prix" & "Année" s'ils existent dans ce groupe (déjà gérés en haut)
        const items = g.items.filter((it) => {
          const l = it.label.toLowerCase();
          return !(l.includes("prix") || l.includes("année"));
        });
        if (items.length === 0) return null;

        return (
          <Group key={g.id} title={g.name}>
            {items.map((it) => {
              if (it.range && it.data_type !== "text") return (
                <div key={it.id}>
                  <div className="mb-1 text-sm text-neutral-300">{it.label}{it.unit ? ` (${it.unit})` : ""}</div>
                  {renderNumericItem(it)}
                </div>
              );
              if (it.options && it.options.length > 0) return (
                <div key={it.id}>
                  <div className="mb-1 text-sm text-neutral-300">{it.label}</div>
                  {renderOptionsItem(it)}
                </div>
              );
              // Bool (ABS, Contrôle de traction, etc.)
              if (it.data_type === "bool") return (
                <div key={it.id}>
                  <div className="mb-1 text-sm text-neutral-300">{it.label}</div>
                  {renderBoolItem(it)}
                </div>
              );
              // Si pas de données exploitables
              return (
                <div key={it.id} className="text-sm text-neutral-500">
                  {it.label} —
                </div>
              );
            })}
          </Group>
        );
      })}
    </div>
  );
}
