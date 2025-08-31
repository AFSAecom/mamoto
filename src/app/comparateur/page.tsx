'use client';

import { createClient } from '@supabase/supabase-js';
import { Fragment, useEffect, useMemo, useState } from 'react';

interface SpecGroup {
  id: string;
  name: string;
  sort_order: number | null;
}

interface SpecItem {
  id: string;
  group_id: string;
  key: string | null;
  label: string;
  unit: string | null;
  sort_order: number | null;
}

interface Brand {
  id: string;
  name: string;
}

interface Moto {
  id: string;
  brand_id: string;
  brand_name: string | null;
  model_name: string;
  year: number | null;
}

interface SpecValue {
  value_text: string | null;
  value_number: number | null;
  value_boolean: boolean | null;
  value_json: unknown;
  unit_override: string | null;
}

export default function ComparatorPage() {
  const [groups, setGroups] = useState<SpecGroup[]>([]);
  const [items, setItems] = useState<SpecItem[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // ajout de motos
  const [adding, setAdding] = useState(false);
  const [formBrand, setFormBrand] = useState('');
  const [formModels, setFormModels] = useState<Moto[]>([]);
  const [formModelId, setFormModelId] = useState('');
  const [loadingModels, setLoadingModels] = useState(false);

  const [selectedMotoIds, setSelectedMotoIds] = useState<string[]>([]);
  const [motoInfoMap, setMotoInfoMap] = useState<Record<string, Moto>>({});

  const [valuesMap, setValuesMap] = useState<
    Record<string, Record<string, SpecValue>>
  >({});

  const [loading, setLoading] = useState(true);
  const [loadingValues, setLoadingValues] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = useMemo(() => {
    if (!url || !anon) return null;
    return createClient(url, anon);
  }, [url, anon]);

  // chargement initial des groupes, items et marques
  useEffect(() => {
    if (!supabase) {
      setError(
        'Variables NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY manquantes.'
      );
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const [groupsRes, itemsRes, brandsRes] = await Promise.all([
          supabase
            .from('spec_groups')
            .select('id,name,sort_order')
            .order('sort_order', { ascending: true, nullsFirst: false })
            .order('name', { ascending: true }),
          supabase
            .from('spec_items')
            .select('id,group_id,key,label,unit,sort_order')
            .order('sort_order', { ascending: true, nullsFirst: false })
            .order('label', { ascending: true }),
          supabase.from('brands').select('id,name').order('name', {
            ascending: true,
          }),
        ]);

        if (groupsRes.error) throw groupsRes.error;
        if (itemsRes.error) throw itemsRes.error;
        if (brandsRes.error) throw brandsRes.error;

        setGroups(groupsRes.data ?? []);
        setItems(itemsRes.data ?? []);
        setBrands(brandsRes.data ?? []);
      } catch (e: any) {
        setError(e.message ?? 'Erreur inattendue');
      } finally {
        setLoading(false);
      }
    })();
  }, [supabase]);

  const itemsByGroup = useMemo(() => {
    const map: Record<string, SpecItem[]> = {};
    for (const item of items) {
      if (!map[item.group_id]) map[item.group_id] = [];
      map[item.group_id].push(item);
    }
    return map;
  }, [items]);

  const handleBrandChange = async (id: string) => {
    setFormBrand(id);
    setFormModelId('');
    setFormModels([]);
    if (!id || !supabase) return;
    setLoadingModels(true);
    try {
      const res = await supabase
        .from('motos')
        .select('id,brand_id,model_name,year,brand_name')
        .eq('brand_id', id);
      if (res.error) throw res.error;
      setFormModels(res.data ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Erreur inattendue');
    } finally {
      setLoadingModels(false);
    }
  };

  const confirmAdd = () => {
    const id = formModelId;
    if (!id) return;
    if (selectedMotoIds.includes(id)) {
      setError('Cette moto est déjà sélectionnée');
      return;
    }
    const m = formModels.find((mm) => mm.id === id);
    if (!m) return;
    setMotoInfoMap((prev) => ({ ...prev, [id]: m }));
    setSelectedMotoIds((prev) => [...prev, id]);
    setAdding(false);
    setFormBrand('');
    setFormModelId('');
    setFormModels([]);
  };

  const removeMoto = (id: string) => {
    setSelectedMotoIds((prev) => prev.filter((m) => m !== id));
    setMotoInfoMap((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  // chargement des valeurs des specs pour les motos sélectionnées
  useEffect(() => {
    if (!supabase) return;
    if (selectedMotoIds.length === 0) {
      setValuesMap({});
      return;
    }
    setLoadingValues(true);
    (async () => {
      try {
        const res = await supabase
          .from('moto_spec_values')
          .select(
            'moto_id,spec_item_id,value_text,value_number,value_boolean,value_json,unit_override'
          )
          .in('moto_id', selectedMotoIds);
        if (res.error) throw res.error;
        const map: Record<string, Record<string, SpecValue>> = {};
        for (const row of res.data ?? []) {
          if (!map[row.moto_id]) map[row.moto_id] = {};
          map[row.moto_id][row.spec_item_id] = {
            value_text: row.value_text,
            value_number: row.value_number,
            value_boolean: row.value_boolean,
            value_json: row.value_json,
            unit_override: row.unit_override,
          };
        }
        setValuesMap(map);
      } catch (e: any) {
        setError(e.message ?? 'Erreur inattendue');
      } finally {
        setLoadingValues(false);
      }
    })();
  }, [supabase, selectedMotoIds]);

  const renderValue = (motoId: string, item: SpecItem) => {
    const v = valuesMap[motoId]?.[item.id];
    if (!v) return '—';
    if (v.value_text) return v.value_text;
    if (v.value_number != null) {
      const unit = v.unit_override || item.unit;
      return unit ? `${v.value_number} ${unit}` : String(v.value_number);
    }
    if (v.value_boolean != null) return v.value_boolean ? 'Oui' : 'Non';
    if (v.value_json != null) return JSON.stringify(v.value_json);
    return '—';
  };

  const headerLabel = (id: string) => {
    const info = motoInfoMap[id];
    const brand =
      info?.brand_name || brands.find((b) => b.id === info?.brand_id)?.name || '';
    return `${brand} — ${info?.model_name || ''}${info?.year ? ` ${info.year}` : ''}`;
  };

  const canAddMore = selectedMotoIds.length < 5;

  if (loading) return <div className="p-4">Chargement…</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (groups.length === 0)
    return <div className="p-4">Aucune caractéristique définie.</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="sticky top-0 bg-background py-2 space-y-2">
        {adding ? (
          <div className="flex gap-4">
            <select
              aria-label="Marque"
              value={formBrand}
              onChange={(e) => handleBrandChange(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="">Sélectionner une marque</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Modèle"
              value={formModelId}
              onChange={(e) => setFormModelId(e.target.value)}
              disabled={!formBrand || loadingModels}
              className="border p-2 rounded"
            >
              <option value="">Sélectionner un modèle</option>
              {formModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.model_name}
                  {m.year ? ` ${m.year}` : ''}
                </option>
              ))}
            </select>
            <button
              onClick={confirmAdd}
              disabled={!formModelId}
              className="border p-2 rounded"
            >
              Ajouter
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setFormBrand('');
                setFormModelId('');
                setFormModels([]);
              }}
              className="border p-2 rounded"
            >
              Annuler
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            disabled={!canAddMore}
            aria-label="Ajouter une moto"
            className="border p-2 rounded"
          >
            Ajouter une moto
          </button>
        )}
      </div>
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-background">
            <tr>
              <th className="text-left p-2 sticky left-0 bg-background z-10">
                Spécifications
              </th>
              {selectedMotoIds.map((id) => (
                <th key={id} className="text-left p-2">
                  <div className="flex items-center gap-2">
                    <span>{headerLabel(id)}</span>
                    <button
                      onClick={() => removeMoto(id)}
                      aria-label="Retirer la moto"
                    >
                      ×
                    </button>
                  </div>
                </th>
              ))}
              {selectedMotoIds.length === 0 && (
                <th className="text-left p-2">Aucune moto sélectionnée</th>
              )}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <Fragment key={group.id}>
                <tr className="bg-muted font-semibold">
                  <th
                    colSpan={(selectedMotoIds.length || 1) + 1}
                    className="text-left p-2 sticky left-0 bg-muted z-10"
                  >
                    {group.name}
                  </th>
                </tr>
                {itemsByGroup[group.id]?.length ? (
                  itemsByGroup[group.id].map((item) => (
                    <tr key={item.id} className="border-b">
                      <th className="text-left p-2 font-medium sticky left-0 bg-background z-10">
                        {item.label}
                        {item.unit && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            {item.unit}
                          </span>
                        )}
                      </th>
                      {selectedMotoIds.length === 0 ? (
                        <td className="p-2">—</td>
                      ) : (
                        selectedMotoIds.map((id) => {
                          const value = renderValue(id, item);
                          return (
                            <td key={id} className="p-2" title={value}>
                              {value}
                            </td>
                          );
                        })
                      )}
                    </tr>
                  ))
                ) : (
                  <tr className="border-b">
                    <th className="italic text-muted-foreground p-2 text-left sticky left-0 bg-background z-10">
                      — Aucune sous-caractéristique —
                    </th>
                    <td className="p-2" colSpan={selectedMotoIds.length || 1}>
                      —
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

