'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

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
  brand_id: string | null;
  model_name: string;
  year: number | null;
}

interface MotoValue {
  value_text: string | null;
  value_number: number | null;
  value_boolean: boolean | null;
  value_json: any | null;
}

export default function ComparatorPage() {
  const [groups, setGroups] = useState<SpecGroup[]>([]);
  const [items, setItems] = useState<SpecItem[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [motos, setMotos] = useState<Moto[]>([]);
  const [values, setValues] = useState<Record<string, MotoValue>>({});

  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [selectedMoto, setSelectedMoto] = useState<Moto | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingMotos, setLoadingMotos] = useState(false);
  const [loadingValues, setLoadingValues] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anon) {
      setError('Variables NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY manquantes.');
      setLoading(false);
      return;
    }

    const supabase = createClient(url, anon);
    supabaseRef.current = supabase;

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
            .order('group_id', { ascending: true })
            .order('sort_order', { ascending: true, nullsFirst: false })
            .order('label', { ascending: true }),
          supabase
            .from('brands')
            .select('id,name')
            .order('name', { ascending: true }),
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
  }, []);

  const itemsByGroup = useMemo(() => {
    const map: Record<string, SpecItem[]> = {};
    for (const item of items) {
      if (!map[item.group_id]) map[item.group_id] = [];
      map[item.group_id].push(item);
    }
    return map;
  }, [items]);

  const handleBrandChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const brand = brands.find((b) => b.id === id) || null;
    setSelectedBrand(brand);
    setSelectedMoto(null);
    setValues({});
    if (!brand || !supabaseRef.current) {
      setMotos([]);
      return;
    }

    setLoadingMotos(true);
    setError(null);
    const { data, error: err } = await supabaseRef.current
      .from('motos')
      .select('id,brand_id,model_name,year')
      .eq('brand_id', brand.id)
      .order('model_name', { ascending: true });
    if (err) {
      setError(err.message);
      setMotos([]);
    } else {
      setMotos(data ?? []);
    }
    setLoadingMotos(false);
  };

  const handleMotoChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const moto = motos.find((m) => m.id === id) || null;
    setSelectedMoto(moto);
    setValues({});
    if (!moto || !supabaseRef.current) return;

    setLoadingValues(true);
    setError(null);
    const { data, error: err } = await supabaseRef.current
      .from('moto_spec_values')
      .select('spec_item_id,value_text,value_number,value_boolean,value_json')
      .eq('moto_id', moto.id);
    if (err) {
      setError(err.message);
      setValues({});
    } else {
      const map: Record<string, MotoValue> = {};
      (data ?? []).forEach((v) => {
        map[v.spec_item_id] = {
          value_text: v.value_text,
          value_number: v.value_number,
          value_boolean: v.value_boolean,
          value_json: v.value_json,
        };
      });
      setValues(map);
    }
    setLoadingValues(false);
  };

  const renderValue = (item: SpecItem) => {
    const v = values[item.id];
    if (!v) return '—';
    if (v.value_text) return v.value_text;
    if (v.value_number != null)
      return `${v.value_number}${item.unit ? ` ${item.unit}` : ''}`;
    if (v.value_boolean != null) return v.value_boolean ? 'Oui' : 'Non';
    if (v.value_json != null) return JSON.stringify(v.value_json);
    return '—';
  };

  if (loading) return <div className="p-4">Chargement…</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (groups.length === 0) return <div className="p-4">Aucune caractéristique définie.</div>;

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-white border-b p-4 flex gap-4">
        <select
          aria-label="Marque"
          className="border p-2"
          value={selectedBrand?.id ?? ''}
          onChange={handleBrandChange}
        >
          <option value="">Choisis une marque</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Modèle"
          className="border p-2"
          value={selectedMoto?.id ?? ''}
          onChange={handleMotoChange}
          disabled={!selectedBrand || loadingMotos}
        >
          <option value="">Choisis un modèle</option>
          {motos.map((m) => (
            <option key={m.id} value={m.id}>
              {m.model_name}
              {m.year ? ` ${m.year}` : ''}
            </option>
          ))}
        </select>
      </div>
      <div className="grid md:grid-cols-2 gap-6 p-4">
        <div className="md:sticky md:left-0 md:top-16 bg-white">
          {groups.map((group) => (
            <div key={group.id} className="mb-4">
              <h2 className="font-semibold">{group.name}</h2>
              <ul className="mt-1 ml-4 space-y-1 text-sm">
                {itemsByGroup[group.id]?.length ? (
                  itemsByGroup[group.id].map((item) => (
                    <li key={item.id}>
                      <div>{item.label}</div>
                      {item.unit && (
                        <div className="text-xs text-gray-500">{item.unit}</div>
                      )}
                    </li>
                  ))
                ) : (
                  <li className="italic text-gray-500">
                    — Aucune sous-caractéristique —
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
        <div>
          {!selectedBrand && (
            <div className="p-4 text-sm text-gray-500">
              Choisis une marque puis un modèle
            </div>
          )}
          {selectedBrand && !selectedMoto && (
            <div className="p-4 text-sm text-gray-500">Choisis un modèle</div>
          )}
          {selectedMoto && (
            <div>
              <h3 className="font-semibold mb-2">
                {selectedBrand
                  ? `${selectedBrand.name} — ${selectedMoto.model_name}`
                  : selectedMoto.model_name}
                {selectedMoto.year ? ` ${selectedMoto.year}` : ''}
              </h3>
              {loadingValues ? (
                <div className="p-4 text-sm text-gray-500">Chargement…</div>
              ) : (
                groups.map((group) => (
                  <div key={group.id} className="mb-4">
                    <h4 className="font-medium">{group.name}</h4>
                    <ul className="mt-1 ml-4 space-y-1 text-sm">
                      {itemsByGroup[group.id]?.length ? (
                        itemsByGroup[group.id].map((item) => (
                          <li key={item.id}>{renderValue(item)}</li>
                        ))
                      ) : (
                        <li className="italic text-gray-500">—</li>
                      )}
                    </ul>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

