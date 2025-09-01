"use client";
import React from "react";
import { supabase } from "@/lib/supabaseClient";

type Option = { value: string; label: string };

export default function CompareFilters(props: {
  onBrandChange?: (brand_id: string | null) => void;
  onModelChange?: (model: string | null) => void;
  default_brand_id?: string | null;
  default_model?: string | null;
}) {
  const [brands, setBrands] = React.useState<Option[]>([]);
  const [models, setModels] = React.useState<Option[]>([]);
  const [brand_id, setBrandId] = React.useState<string | null>(
    props.default_brand_id ?? null,
  );
  const [model, setModel] = React.useState<string | null>(
    props.default_model ?? null,
  );
  const [loadingBrands, setLoadingBrands] = React.useState(false);
  const [loadingModels, setLoadingModels] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadBrands = async () => {
      try {
        setLoadingBrands(true);
        setError(null);
        const { data, error } = await supabase
          .from("brands")
          .select("id,name")
          .order("name", { ascending: true });
        if (error) throw error;
        setBrands(
          (data ?? []).map((b: any) => ({ value: b.id, label: b.name })),
        );
      } catch (e: any) {
        console.error(e);
        setError("Impossible de charger les marques.");
      } finally {
        setLoadingBrands(false);
      }
    };
    loadBrands();
  }, []);

  React.useEffect(() => {
    const loadModels = async () => {
      if (!brand_id) {
        setModels([]);
        setModel(null);
        return;
      }
      try {
        setLoadingModels(true);
        setError(null);
        let { data, error } = await supabase
          .from("models")
          .select("name")
          .eq("brand_id", brand_id)
          .order("name", { ascending: true });

        if (error || !data?.length) {
          const { data: rows, error: err } = await supabase
            .from("motos")
            // Cast options to any to accommodate "distinct", which is supported
            // by Supabase but missing from the current type definitions.
            .select("model_name", { distinct: true } as any)
            .eq("brand_id", brand_id)
            .order("model_name", { ascending: true });
          if (err) throw err;
          setModels(
            (rows ?? []).map((m: any) => ({
              value: m.model_name,
              label: m.model_name,
            })),
          );
        } else {
          setModels(
            (data ?? []).map((m: any) => ({ value: m.name, label: m.name })),
          );
        }
        setModel(null);
      } catch (e: any) {
        console.error(e);
        setError("Impossible de charger les modèles.");
        setModels([]);
      } finally {
        setLoadingModels(false);
      }
    };
    loadModels();
  }, [brand_id]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <label className="block text-sm mb-2">Marque</label>
        <select
          className="w-full border rounded p-2"
          value={brand_id ?? ""}
          onChange={(e) => {
            const v = e.target.value || null;
            setBrandId(v);
            props.onBrandChange?.(v);
          }}
        >
          <option value="">
            {loadingBrands ? "Chargement…" : "Choisir une marque"}
          </option>
          {brands.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm mb-2">Modèle</label>
        <select
          className="w-full border rounded p-2"
          value={model ?? ""}
          disabled={!brand_id}
          onChange={(e) => {
            const v = e.target.value || null;
            setModel(v);
            props.onModelChange?.(v);
          }}
        >
          <option value="">
            {!brand_id
              ? "Choisir d’abord une marque"
              : loadingModels
                ? "Chargement…"
                : "Choisir un modèle"}
          </option>
          {models.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
