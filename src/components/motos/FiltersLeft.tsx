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
};
type FParam = { filters: Filters; page: number };

function base64UrlEncode(str: string) {
  if (typeof window !== "undefined" && "btoa" in window) {
    return window
      .btoa(str)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }
  // Fallback (rare côté client)
  // @ts-ignore
  return Buffer.from(str, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
function addBase64Padding(b64: string) {
  const pad = b64.length % 4;
  return pad ? b64 + "=".repeat(4 - pad) : b64;
}
function base64UrlDecodeToObj<T = any>(b64: string | null): T | null {
  try {
    if (!b64 || b64.trim() === "") return null;
    const std = addBase64Padding(b64.replace(/-/g, "+").replace(/_/g, "/"));
    const json =
      typeof window !== "undefined" && "atob" in window
        ? window.atob(std)
        : // @ts-ignore
          Buffer.from(std, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function cleanFilters(obj: Filters): Filters {
  const out: Filters = {};
  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (obj.brand_id && uuidRe.test(obj.brand_id)) out.brand_id = obj.brand_id;

  const toInt = (v: any) =>
    typeof v === "number"
      ? v
      : typeof v === "string" && v.trim() !== "" && !isNaN(parseInt(v, 10))
      ? parseInt(v, 10)
      : undefined;
  const toNum = (v: any) =>
    typeof v === "number"
      ? v
      : typeof v === "string" && v.trim() !== "" && !isNaN(parseFloat(v))
      ? parseFloat(v)
      : undefined;

  const ymn = toInt(obj.year_min);
  if (ymn !== undefined) out.year_min = ymn;
  const ymx = toInt(obj.year_max);
  if (ymx !== undefined) out.year_max = ymx;

  const pmin = toNum(obj.price_min);
  if (pmin !== undefined) out.price_min = pmin;
  const pmax = toNum(obj.price_max);
  if (pmax !== undefined) out.price_max = pmax;

  if (typeof obj.q === "string" && obj.q.trim() !== "") out.q = obj.q.trim();

  return out;
}

export default function FiltersLeft({
  brands,
  initialF = "",
  initialFilters,
}: {
  brands: Brand[];
  initialF?: string;
  initialFilters?: Filters;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Source de vérité = URL (paramètre f). Fallback sur initialF si besoin.
  const fFromUrl = sp.get("f");
  const fObj =
    base64UrlDecodeToObj<FParam>(fFromUrl) ||
    base64UrlDecodeToObj<FParam>(initialF) || { filters: {}, page: 0 };

  const filters = useMemo<Filters>(() => {
    const from = fObj?.filters || {};
    return cleanFilters(from);
  }, [fObj]);

  // Helpers pour inputs (valeur vide par défaut → pas de "0" forcé)
  const valStr = (v?: number | string) =>
    v === undefined || v === null ? "" : String(v);

  const onChangePatch = (patch: Partial<Filters>) => {
    const next: FParam = {
      filters: cleanFilters({ ...(fObj?.filters || {}), ...patch }),
      page: 0, // reset pagination à chaque modif
    };

    const encoded = base64UrlEncode(JSON.stringify(next));
    startTransition(() => {
      router.replace(`/motos?f=${encoded}`, { scroll: false });
    });
  };

  const onBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    onChangePatch({ brand_id: v === "" ? undefined : v });
  };

  const onInputNumber =
    (key: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      if (v.trim() === "") {
        onChangePatch({ [key]: undefined });
        return;
      }
      onChangePatch({ [key]: v as any });
    };

  const onInputText =
    (key: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      onChangePatch({ [key]: v });
    };

  return (
    <div className="space-y-4">
      {/* Marque */}
      <div className="flex flex-col">
        <label className="mb-1 text-sm opacity-80">Marque</label>
        <select
          className="w-full rounded-md border border-white/15 bg-transparent px-3 py-2"
          value={valStr(filters.brand_id)}
          onChange={onBrandChange}
        >
          <option value="">Toutes marques</option>
          {brands?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* Année min / max */}
      <div className="flex flex-col">
        <label className="mb-1 text-sm opacity-80">Année min</label>
        <input
          type="number"
          inputMode="numeric"
          placeholder="0"
          className="w-full rounded-md border border-white/15 bg-transparent px-3 py-2"
          value={valStr(filters.year_min)}
          onChange={onInputNumber("year_min")}
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
          onChange={onInputNumber("year_max")}
        />
      </div>

      {/* Prix min / max */}
      <div className="flex flex-col">
        <label className="mb-1 text-sm opacity-80">Prix min</label>
        <input
          type="number"
          inputMode="decimal"
          placeholder="0"
          className="w-full rounded-md border border-white/15 bg-transparent px-3 py-2"
          value={valStr(filters.price_min)}
          onChange={onInputNumber("price_min")}
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
          onChange={onInputNumber("price_max")}
        />
      </div>

      {/* Recherche */}
      <div className="flex flex-col">
        <label className="mb-1 text-sm opacity-80">Recherche</label>
        <input
          type="text"
          placeholder="Rechercher"
          className="w-full rounded-md border border-white/15 bg-transparent px-3 py-2"
          value={valStr(filters.q)}
          onChange={onInputText("q")}
        />
      </div>

      {isPending ? (
        <p className="text-xs opacity-60">Mise à jour…</p>
      ) : null}
    </div>
  );
}
