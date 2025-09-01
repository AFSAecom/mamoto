// src/components/motos/FiltersLeft.tsx
"use client";

import React, { useMemo, useTransition } from "react";
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
type FParam = { filters: Filters; page: number };

type SpecGroup = {
  id: string;
  name: string;
  items: Array<{
    id: string;
    label: string;
    unit: string | null;
    data_type: string;
    range: { spec_item_id: string; min_value: number | null; max_value: number | null } | null;
    options: Array<{ value: string; count: number }>;
  }>;
};

function base64UrlEncode(str: string) {
  if (typeof window !== "undefined" && "btoa" in window) {
    return window.btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }
  // @ts-ignore
  return Buffer.from(str, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function addBase64Padding(b64: string) {
  const pad = b64.length % 4;
  return pad ? b64 + "=".repeat(4 - pad) : b64;
}
function base64UrlDecodeToObj<T = any>(b64: string | null): T | null {
  try {
    if (!b64 || b64.trim() === "") return null;
    const std = addBase64Padding(b64.replace(/-/g, "+").replace(/_/g, "/"));
    const json = typeof window !== "undefined" && "atob" in window ? window.atob(std) : Buffer.from(std, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function cleanFilters(obj: Filters): Filters {
  const out: Filters = { ...obj };
  const cleanNum = (v: any) =>
    typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" && !isNaN(parseFloat(v)) ? Number(v) : undefined;
  if (obj.year_min !== undefined) out.year_min = cleanNum(obj.year_min);
  if (obj.year_max !== undefined) out.year_max = cleanNum(obj.year_max);
  if (obj.price_min !== undefined) out.price_min = cleanNum(obj.price_min);
  if (obj.price_max !== undefined) out.price_max = cleanNum(obj.price_max);

  const nextSpecs: Record<string, any> = {};
  if (obj.specs) {
    for (const [k, v] of Object.entries(obj.specs)) {
      if (!v || typeof v !== "object") continue;
      if ((v as any).type === "number") {
        const min = cleanNum((v as any).min);
        const max = cleanNum((v as any).max);
        if (min === undefined && max === undefined) continue;
        nextSpecs[k] = { type: "number", min, max };
      } else if ((v as any).type === "boolean") {
        if (typeof (v as any).value === "boolean") nextSpecs[k] = { type: "boolean", value: (v as any).value };
      } else if ((v as any).type === "text") {
        const values = Array.isArray((v as any).values) ? (v as any).values.filter((s: any) => typeof s === "string" && s.trim() !== "") : [];
        if (values.length) nextSpecs[k] = { type: "text", values };
      }
    }
  }
  if (Object.keys(nextSpecs).length) out.specs = nextSpecs;
  else delete out.specs;

  return out;
}

export default function FiltersLeft({
  brands,
  initialF = "",
  initialFilters,
  specSchema,
}: {
  brands: Brand[];
  initialF?: string;
  initialFilters?: Filters;
  specSchema: SpecGroup[];
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const fFromUrl = sp.get("f");
  const fObj = base64UrlDecodeToObj<FParam>(fFromUrl) || base64UrlDecodeToObj<FParam>(initialF) || { filters: {}, page: 0 };
  const filters = useMemo<Filters>(() => cleanFilters(fObj?.filters || {}), [fObj]);

  const valStr = (v?: number | string) => (v === undefined || v === null ? "" : String(v));

  const patchFilters = (patch: Partial<Filters>) => {
    const next: FParam = { filters: cleanFilters({ ...(fObj?.filters || {}), ...patch }), page: 0 };
    const encoded = base64UrlEncode(JSON.stringify(next));
    startTransition(() => router.replace(`/motos?f=${encoded}`, { scroll: false }));
  };

  const patchSpec = (specId: string, partial: any) => {
    const current = (filters.specs && (filters.specs as any)[specId]) || {};
    const nextSpecs = { ...(filters.specs || {}), [specId]: { ...current, ...partial } };
    patchFilters({ specs: nextSpecs });
  };
  const clearSpec = (specId: string) => {
    const nextSpecs = { ...(filters.specs || {}) };
    delete (nextSpecs as any)[specId];
    patchFilters({ specs: nextSpecs });
  };

  return (
    <div className="space-y-6 pr-2">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold opacity-90">Motos</h3>

        <div className="flex flex-col">
          <label className="mb-1 text-sm opacity-80">Marque</label>
          <select
            className="w-full rounded-md border border-white/15 bg-transparent px-3 py-2"
            value={valStr(filters.brand_id)}
            onChange={(e) => patchFilters({ brand_id: e.target.value || undefined })}
          >
            <option value="">Toutes marques</option>
            {brands?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <label className="mb-1 text-sm opacity-80">Année min</label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="0"
              className="w-full rounded-md border border-white/15 bg-transparent px-3 py-2"
              value={valStr(filters.year_min)}
              onChange={(e) => patchFilters({ year_min: e.target.value === "" ? undefined : (e.target.value as any) })}
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-sm opacity-80">Année max</label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="0"
              className="w-full rounded-md border border-white/15 bg-transparent px-3 py-2"
              value={valStr(filters.year_max)}
              onChange={(e) => patchFilters({ year_max: e.target.value === "" ? undefined : (e.target.value as any) })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <label className="mb-1 text-sm opacity-80">Prix min</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              className="w-full rounded-md border border-white/15 bg-transparent px-3 py-2"
              value={valStr(filters.price_min)}
              onChange={(e) => patchFilters({ price_min: e.target.value === "" ? undefined : (e.target.value as any) })}
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-sm opacity-80">Prix max</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              className="w-full rounded-md border border-white/15 bg-transparent px-3 py-2"
              value={valStr(filters.price_max)}
              onChange={(e) => patchFilters({ price_max: e.target.value === "" ? undefined : (e.target.value as any) })}
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="mb-1 text-sm opacity-80">Recherche</label>
          <input
            type="text"
            placeholder="Rechercher"
            className="w-full rounded-md border border-white/15 bg-transparent px-3 py-2"
            value={valStr(filters.q)}
            onChange={(e) => patchFilters({ q: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-6">
        {specSchema.map((group) => (
          <div key={group.id} className="space-y-3">
            <h4 className="text-sm font-semibold opacity-90">{group.name}</h4>

            {group.items.map((it) => {
              const specSel = (filters.specs && (filters.specs as any)[it.id]) || null;

              if (it.data_type === "number") {
                const min = it.range?.min_value ?? 0;
                const max = it.range?.max_value ?? 0;
                const curMin = specSel?.min ?? "";
                const curMax = specSel?.max ?? "";
                return (
                  <div key={it.id} className="space-y-1">
                    <label className="text-sm">{it.label}{it.unit ? ` (${it.unit})` : ""}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        inputMode="decimal"
                        placeholder={String(min)}
                        className="w-full rounded-md border border-white/15 bg-transparent px-3 py-2"
                        value={valStr(curMin)}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "") clearSpec(it.id);
                          else patchSpec(it.id, { type: "number", min: v });
                        }}
                      />
                      <input
                        type="number"
                        inputMode="decimal"
                        placeholder={String(max)}
                        className="w-full rounded-md border border-white/15 bg-transparent px-3 py-2"
                        value={valStr(curMax)}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "") clearSpec(it.id);
                          else patchSpec(it.id, { type: "number", max: v });
                        }}
                      />
                    </div>
                  </div>
                );
              }

              if (it.data_type === "boolean") {
                const cur = specSel?.value;
                return (
                  <div key={it.id} className="space-y-1">
                    <label className="text-sm">{it.label}</label>
                    <div className="flex items-center gap-3 text-sm">
                      <label className="flex items-center gap-1">
                        <input type="radio" name={`b-${it.id}`} checked={cur === undefined} onChange={() => clearSpec(it.id)} /> Tous
                      </label>
                      <label className="flex items-center gap-1">
                        <input type="radio" name={`b-${it.id}`} checked={cur === true} onChange={() => patchSpec(it.id, { type: "boolean", value: true })} /> Oui
                      </label>
                      <label className="flex items-center gap-1">
                        <input type="radio" name={`b-${it.id}`} checked={cur === false} onChange={() => patchSpec(it.id, { type: "boolean", value: false })} /> Non
                      </label>
                    </div>
                  </div>
                );
              }

              return (
                <div key={it.id} className="space-y-1">
                  <label className="text-sm">{it.label}</label>
                  <div className="max-h-40 overflow-auto pr-1 space-y-1">
                    {it.options?.map((op) => {
                      const selected = Array.isArray((specSel && (specSel as any).values) ? (specSel as any).values : []) && (specSel as any).values.includes(op.value);
                      const valuesSet = new Set<string>(Array.isArray((specSel as any)?.values) ? (specSel as any).values : []);
                      return (
                        <label key={op.value} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={valuesSet.has(op.value)}
                            onChange={(e) => {
                              if (e.target.checked) valuesSet.add(op.value);
                              else valuesSet.delete(op.value);
                              const arr = Array.from(valuesSet);
                              if (arr.length === 0) clearSpec(it.id);
                              else patchSpec(it.id, { type: "text", values: arr });
                            }}
                          />
                          <span>{op.value}</span>
                          <span className="opacity-50">({op.count})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {isPending ? <p className="text-xs opacity-60">Mise à jour…</p> : null}
    </div>
  );
}
