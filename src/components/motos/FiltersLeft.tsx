// src/components/motos/FiltersLeft.tsx
"use client";

import React, { useMemo, useState, useTransition } from "react";
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
    data_type: "number" | "text" | "boolean" | string;
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

function cleanNumber(v: any): number | undefined {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "" && !isNaN(parseFloat(v))) return Number(v);
  return undefined;
}
function cleanFilters(obj: Filters): Filters {
  const out: Filters = { ...obj };
  if (obj.year_min !== undefined) out.year_min = cleanNumber(obj.year_min);
  if (obj.year_max !== undefined) out.year_max = cleanNumber(obj.year_max);
  if (obj.price_min !== undefined) out.price_min = cleanNumber(obj.price_min);
  if (obj.price_max !== undefined) out.price_max = cleanNumber(obj.price_max);

  const nextSpecs: Record<string, any> = {};
  if (obj.specs) {
    for (const [k, v] of Object.entries(obj.specs)) {
      if (!v || typeof v !== "object") continue;
      const vv: any = v;
      if (vv.type === "number") {
        const min = cleanNumber(vv.min);
        const max = cleanNumber(vv.max);
        if (min === undefined && max === undefined) continue;
        nextSpecs[k] = { type: "number", min, max };
      } else if (vv.type === "boolean") {
        if (typeof vv.value === "boolean") nextSpecs[k] = { type: "boolean", value: vv.value };
      } else if (vv.type === "text") {
        const arr: string[] = Array.isArray(vv.values) ? vv.values.filter((s: any) => typeof s === "string" && s.trim() !== "") : [];
        if (arr.length) nextSpecs[k] = { type: "text", values: arr };
      }
    }
  }
  if (Object.keys(nextSpecs).length) out.specs = nextSpecs;
  else delete out.specs;
  return out;
}

const formatInt = (v: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(v);
const formatPrice = (v: number) => `${formatInt(v)} DT`;

/** Dual range with pointer-events trick + value badges */
function DualRange({
  min = 0, max = 100, step = 1,
  valueMin, valueMax, onChange,
  format = (v: number) => String(v),
}: {
  min?: number; max?: number; step?: number;
  valueMin: number; valueMax: number;
  onChange: (vmin: number, vmax: number) => void;
  format?: (v: number) => string;
}) {
  const [a, setA] = useState<number>(valueMin);
  const [b, setB] = useState<number>(valueMax);

  React.useEffect(() => setA(valueMin), [valueMin]);
  React.useEffect(() => setB(valueMax), [valueMax]);

  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const pct = (x: number) => ((x - min) * 100) / (max - min);

  const handleA = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setA(v);
    onChange(Math.min(v, b), Math.max(v, b));
  };
  const handleB = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setB(v);
    onChange(Math.min(a, v), Math.max(a, v));
  };

  const zA = a > b ? 6 : 7;
  const zB = b >= a ? 6 : 7;

  return (
    <div className="relative h-10 mt-1">
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-white/15" />
      <div className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full bg-red-500" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
      <div className="absolute -top-5 text-xs px-1 py-0.5 rounded bg-black/40" style={{ left: `${pct(a)}%`, transform: "translate(-50%,0)", pointerEvents: "none" }}>{format(a)}</div>
      <div className="absolute -top-5 text-xs px-1 py-0.5 rounded bg-black/40" style={{ left: `${pct(b)}%`, transform: "translate(-50%,0)", pointerEvents: "none" }}>{format(b)}</div>
      <input type="range" min={min} max={max} step={step} value={a} onChange={handleA} className="dual absolute inset-0 w-full appearance-none bg-transparent" style={{ zIndex: zA }} />
      <input type="range" min={min} max={max} step={step} value={b} onChange={handleB} className="dual absolute inset-0 w-full appearance-none bg-transparent" style={{ zIndex: zB }} />
      <style jsx>{`
        .dual { pointer-events: none; }
        .dual::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 18px; width: 14px; border-radius: 4px;
          background: #bdbdbd; border: 1px solid rgba(255,255,255,.25);
          margin-top: -8px; cursor: pointer; pointer-events: all;
        }
        .dual::-moz-range-thumb {
          height: 18px; width: 14px; border-radius: 4px;
          background: #bdbdbd; border: 1px solid rgba(255,255,255,.25);
          cursor: pointer; pointer-events: all;
        }
      `}</style>
    </div>
  );
}

function SectionHeader({
  title, isOpen, toggle, onClear, hasActive,
}: { title: string; isOpen: boolean; toggle: () => void; onClear?: () => void; hasActive?: boolean; }) {
  return (
    <div className="flex items-center justify-between py-2 select-none">
      <button type="button" onClick={toggle} className="flex items-center gap-2 text-sm font-semibold">
        <span className="inline-block w-4 text-center">{isOpen ? "−" : "+"}</span>
        <span>{title}</span>
      </button>
      {onClear ? (
        <button title="Réinitialiser" onClick={onClear} className={`text-xs opacity-60 hover:opacity-100 ${hasActive ? "" : "invisible"}`}>⨯</button>
      ) : null}
    </div>
  );
}

export default function FiltersLeft({
  brands, initialF = "", initialFilters, specSchema = [],
}: { brands: Brand[]; initialF?: string; initialFilters?: Filters; specSchema?: SpecGroup[]; }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const fFromUrl = sp.get("f");
  const fObj = base64UrlDecodeToObj<FParam>(fFromUrl) || base64UrlDecodeToObj<FParam>(initialF) || { filters: {}, page: 0 };
  const filters = useMemo<Filters>(() => cleanFilters(fObj?.filters || {}), [fObj]);

  // Init état des groupes une seule fois (ne pas réinitialiser après navigation)
  const defaultOpen: Record<string, boolean> = useMemo(() => {
    const m: Record<string, boolean> = {};
    (specSchema || []).forEach((g) => {
      const anyActive = (g.items || []).some((it) => !!filters.specs?.[it.id]);
      m[g.id] = anyActive; // ouvre par défaut s'il y a un critère actif dans ce groupe
    });
    return m;
  }, []); // ⬅️ only once
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => defaultOpen);
  const setGroupOpen = (id: string, open: boolean) => setOpenGroups((s) => ({ ...s, [id]: open }));

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

  const PRICE_MIN = 0, PRICE_MAX = 500000, PRICE_STEP = 500;
  const YEAR_MIN = 1980, YEAR_MAX = new Date().getFullYear() + 1, YEAR_STEP = 1;

  const priceMin = cleanNumber(filters.price_min) ?? PRICE_MIN;
  const priceMax = cleanNumber(filters.price_max) ?? PRICE_MAX;
  const yearMin = cleanNumber(filters.year_min) ?? YEAR_MIN;
  const yearMax = cleanNumber(filters.year_max) ?? YEAR_MAX;

  return (
    <div className="space-y-6 pr-2">
      {/* Bloc filtres "Motos" */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold opacity-90">Motos</h3>

        {/* Marque */}
        <div className="flex flex-col">
          <label className="mb-1 text-sm opacity-80">Marque</label>
          <select className="w-full rounded-md border border-white/15 bg-transparent px-3 py-2" value={valStr(filters.brand_id)} onChange={(e) => patchFilters({ brand_id: e.target.value || undefined })}>
            <option value="">Toutes marques</option>
            {brands?.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
          </select>
        </div>

        {/* Recherche */}
        <div className="flex flex-col">
          <label className="mb-1 text-sm opacity-80">Mots clefs</label>
          <input type="text" placeholder="Rechercher" className="w-full rounded-md border border-white/15 bg-transparent px-3 py-2" value={valStr(filters.q)} onChange={(e) => patchFilters({ q: e.target.value })} />
        </div>

        {/* Prix */}
        <div className="rounded-lg border border-white/10 p-3">
          <SectionHeader title="Prix" isOpen={true} toggle={() => {}} onClear={() => patchFilters({ price_min: undefined, price_max: undefined })} hasActive={filters.price_min !== undefined || filters.price_max !== undefined} />
          <div className="grid grid-cols-2 gap-2">
            <input type="number" inputMode="decimal" placeholder={String(PRICE_MIN)} className="w-full rounded-md border border-white/15 bg-transparent px-3 py-2" value={valStr(filters.price_min)} onChange={(e) => patchFilters({ price_min: e.target.value === "" ? undefined : (e.target.value as any) })} />
            <input type="number" inputMode="decimal" placeholder={String(PRICE_MAX)} className="w-full rounded-md border border-white/15 bg-transparent px-3 py-2" value={valStr(filters.price_max)} onChange={(e) => patchFilters({ price_max: e.target.value === "" ? undefined : (e.target.value as any) })} />
          </div>
          <DualRange min={PRICE_MIN} max={PRICE_MAX} step={PRICE_STEP} valueMin={priceMin} valueMax={priceMax} onChange={(vmin, vmax) => patchFilters({ price_min: vmin, price_max: vmax })} format={formatPrice} />
        </div>

        {/* Année */}
        <div className="rounded-lg border border-white/10 p-3">
          <SectionHeader title="Année" isOpen={true} toggle={() => {}} onClear={() => patchFilters({ year_min: undefined, year_max: undefined })} hasActive={filters.year_min !== undefined || filters.year_max !== undefined} />
          <div className="grid grid-cols-2 gap-2">
            <input type="number" inputMode="numeric" placeholder={String(YEAR_MIN)} className="w-full rounded-md border border-white/15 bg-transparent px-3 py-2" value={valStr(filters.year_min)} onChange={(e) => patchFilters({ year_min: e.target.value === "" ? undefined : (e.target.value as any) })} />
            <input type="number" inputMode="numeric" placeholder={String(YEAR_MAX)} className="w-full rounded-md border border-white/15 bg-transparent px-3 py-2" value={valStr(filters.year_max)} onChange={(e) => patchFilters({ year_max: e.target.value === "" ? undefined : (e.target.value as any) })} />
          </div>
          <DualRange min={YEAR_MIN} max={YEAR_MAX} step={YEAR_STEP} valueMin={yearMin} valueMax={yearMax} onChange={(vmin, vmax) => patchFilters({ year_min: vmin, year_max: vmax })} format={(v) => String(v)} />
        </div>
      </div>

      {/* Groups de specs */}
      <div className="space-y-4">
        {(specSchema || []).map((group) => {
          const isOpen = !!openGroups[group.id];
          const hasActive = (group.items || []).some((it) => !!filters.specs?.[it.id]);
          return (
            <div key={group.id} className="rounded-lg border border-white/10">
              <div className="px-3">
                <SectionHeader title={group.name} isOpen={isOpen} toggle={() => setGroupOpen(group.id, !isOpen)} onClear={hasActive ? () => {
                  const next = { ...(filters.specs || {}) };
                  for (const it of group.items || []) delete (next as any)[it.id];
                  patchFilters({ specs: next });
                } : undefined} hasActive={hasActive} />
              </div>
              {isOpen ? (
                <div className="px-3 pb-3 space-y-3">
                  {(group.items || []).map((it) => {
                    const specSel: any = (filters.specs && (filters.specs as any)[it.id]) || null;

                    if (it.data_type === "number") {
                      const min = it.range?.min_value ?? 0;
                      const max = it.range?.max_value ?? 0;
                      const curMin = cleanNumber(specSel?.min) ?? min;
                      const curMax = cleanNumber(specSel?.max) ?? max;
                      const single = min === max;

                      return (
                        <div key={it.id} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-sm">{it.label}{it.unit ? ` (${it.unit})` : ""}</label>
                            {(specSel?.min !== undefined || specSel?.max !== undefined) ? (<button className="text-xs opacity-60 hover:opacity-100" onClick={() => clearSpec(it.id)}>⨯</button>) : null}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input type="number" inputMode="decimal" placeholder={String(min)} className="w-full rounded-md border border-white/15 bg-transparent px-3 py-2" value={specSel?.min ?? ""} onChange={(e) => {
                              const v = e.target.value;
                              if (v === "") clearSpec(it.id);
                              else patchSpec(it.id, { type: "number", min: v });
                            }} />
                            <input type="number" inputMode="decimal" placeholder={String(max)} className="w-full rounded-md border border-white/15 bg-transparent px-3 py-2" value={specSel?.max ?? ""} onChange={(e) => {
                              const v = e.target.value;
                              if (v === "") clearSpec(it.id);
                              else patchSpec(it.id, { type: "number", max: v });
                            }} />
                          </div>
                          {!single ? (
                            <DualRange min={min} max={max} step={1} valueMin={curMin} valueMax={curMax} onChange={(vmin, vmax) => patchSpec(it.id, { type: "number", min: vmin, max: vmax })} format={(v) => (it.unit ? `${formatInt(v)} ${it.unit}` : formatInt(v))} />
                          ) : null}
                        </div>
                      );
                    }

                    if (it.data_type === "boolean") {
                      const cur = specSel?.value;
                      return (
                        <div key={it.id} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-sm">{it.label}</label>
                            {cur !== undefined ? (<button className="text-xs opacity-60 hover:opacity-100" onClick={() => clearSpec(it.id)}>⨯</button>) : null}
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <label className="flex items-center gap-1"><input type="radio" name={`b-${it.id}`} checked={cur === undefined} onChange={() => clearSpec(it.id)} /> Tous</label>
                            <label className="flex items-center gap-1"><input type="radio" name={`b-${it.id}`} checked={cur === true} onChange={() => patchSpec(it.id, { type: "boolean", value: true })} /> Oui</label>
                            <label className="flex items-center gap-1"><input type="radio" name={`b-${it.id}`} checked={cur === false} onChange={() => patchSpec(it.id, { type: "boolean", value: false })} /> Non</label>
                          </div>
                        </div>
                      );
                    }

                    const valuesArray: string[] = Array.isArray(specSel?.values) ? (specSel.values as string[]) : [];
                    const valuesSet = new Set<string>(valuesArray);

                    return (
                      <div key={it.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-sm">{it.label}</label>
                          {valuesSet.size > 0 ? (<button className="text-xs opacity-60 hover:opacity-100" onClick={() => clearSpec(it.id)}>⨯</button>) : null}
                        </div>
                        <div className="max-h-40 overflow-auto pr-1 space-y-1">
                          {(it.options || []).map((op) => (
                            <label key={op.value} className="flex items-center gap-2 text-sm opacity-90">
                              <input type="checkbox" checked={valuesSet.has(op.value)} onChange={(e) => {
                                if (e.target.checked) valuesSet.add(op.value);
                                else valuesSet.delete(op.value);
                                const arr = Array.from(valuesSet);
                                if (arr.length === 0) clearSpec(it.id);
                                else patchSpec(it.id, { type: "text", values: arr });
                              }} />
                              <span>{op.value}</span>
                              <span className="opacity-50">({op.count})</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {isPending ? <p className="text-xs opacity-60">Mise à jour…</p> : null}
    </div>
  );
}
