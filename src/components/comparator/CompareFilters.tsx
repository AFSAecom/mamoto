"use client";

import { useEffect, useMemo, useState } from "react";
import { allBrands, modelsByBrand } from "@/lib/catalog-helpers";
import { useCompare } from "@/store/useCompare";

export default function CompareFilters() {
  const addMoto = useCompare((s) => s.addMoto);
  const hydrateQS = useCompare((s) => s.hydrateQS);
  const selected = useCompare((s) => s.selected);

  const [brand, setBrand] = useState<string>("");
  const [modelId, setModelId] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search).get("m");
    if (!p) return;
    const ids = p.split(",").map((s) => s.trim());
    hydrateQS(ids);
  }, [hydrateQS]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const qs = selected.join(",");
    const url = qs ? `?m=${qs}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [selected]);

  const brands = useMemo(() => allBrands(), []);
  const models = useMemo(() => (brand ? modelsByBrand(brand) : []), [brand]);

  const handleAdd = () => {
    if (!modelId) return;
    addMoto(modelId);
    // garder la même marque, mais vider le modèle pour pouvoir en choisir un autre
    setModelId("");
  };

  const disabledAdd = !modelId; // le store bloquera aussi si 4 déjà choisis ou doublon

  return (
    <div className="flex flex-col md:flex-row items-stretch gap-3">
      <select
        className="border rounded p-2"
        value={brand}
        onChange={(e) => {
          setBrand(e.target.value);
          setModelId("");
        }}
      >
        <option value="">Choisir une marque</option>
        {brands.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>

      <select
        className="border rounded p-2"
        value={modelId}
        onChange={(e) => setModelId(e.target.value)}
        disabled={!brand}
      >
        <option value="">
          {brand ? "Choisir un modèle" : "Sélectionnez une marque d’abord"}
        </option>
        {models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>

      <button
        className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        onClick={handleAdd}
        disabled={disabledAdd}
      >
        Ajouter
      </button>
    </div>
  );
}

