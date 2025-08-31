'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// --------------------------- CONFIG DB (adapte ici si besoin) ---------------------------
const DB_COLS = {
  groups: { table: 'spec_groups', id: 'id', name: 'name', sort: 'sort_order' },
  items:  { table: 'spec_items',  id: 'id', groupId: 'group_id', key: 'key', label: 'label', unit: 'unit', sort: 'sort_order' },
  values: { table: 'moto_spec_values', id: 'id', motoId: 'moto_id', itemId: 'spec_item_id', vText: 'value_text', vNum: 'value_number', vBool: 'value_boolean', vJson: 'value_json' },
  motos:  { table: 'motos', id: 'id', brandId: 'brand_id', model: 'model_name', year: 'year', price: 'price_tnd', slug: 'slug' },
  brands: { table: 'brands', id: 'id', name: 'name' },
};
// ---------------------------------------------------------------------------------------

type UUID = string;

type Group = {
  id: UUID;
  name: string;
  sort_order: number | null;
};

type Item = {
  id: UUID;
  group_id: UUID;
  key: string | null;
  label: string;
  unit: string | null;
  sort_order: number | null;
};

type MotoRow = {
  id: UUID;
  brand_id: UUID | null;
  model_name: string;
  year: number | null;
};

type MotoMeta = {
  id: UUID;
  brand_name: string | null;
  model_name: string;
  year: number | null;
};

type ValueCell = {
  value_text: string | null;
  value_number: number | null;
  value_boolean: boolean | null;
  value_json: any | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = (supabaseUrl && supabaseAnon)
  ? createClient(supabaseUrl, supabaseAnon)
  : null;

export default function ComparatorPage() {
  // UI state
  const [search, setSearch] = useState('');
  const [selectedMotoIds, setSelectedMotoIds] = useState<UUID[]>([]);

  // Structure (gauche)
  const [loadingStructure, setLoadingStructure] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [itemsByGroup, setItemsByGroup] = useState<Record<UUID, Item[]>>({});

  // Motos (options + méta)
  const [allMotos, setAllMotos] = useState<MotoRow[]>([]);
  const [brandMap, setBrandMap] = useState<Record<string, string>>({});
  const [motoMetaMap, setMotoMetaMap] = useState<Record<UUID, MotoMeta>>({}); // pour entêtes de colonnes

  // Valeurs { motoId: { itemId: ValueCell } }
  const [valuesMap, setValuesMap] = useState<Record<UUID, Record<UUID, ValueCell>>>({});

  // Vérif env
  if (!supabase) {
    return (
      <div className="p-6">
        <h1 className="text-lg font-semibold mb-2">Comparateur de motos</h1>
        <div className="text-red-600">
          Variables d’environnement manquantes: NEXT_PUBLIC_SUPABASE_URL et/ou NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </div>
      </div>
    );
  }

  // Charger structure: spec_groups + spec_items
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // Groups
        const { data: gData, error: gErr } = await supabase
          .from(DB_COLS.groups.table)
          .select(`${DB_COLS.groups.id} as id, ${DB_COLS.groups.name} as name, ${DB_COLS.groups.sort} as sort_order`)
          .order(DB_COLS.groups.sort, { ascending: true, nullsFirst: false })
          .order(DB_COLS.groups.name, { ascending: true });
        if (gErr) throw gErr;

        // Items
        const { data: iData, error: iErr } = await supabase
          .from(DB_COLS.items.table)
          .select([
            `${DB_COLS.items.id} as id`,
            `${DB_COLS.items.groupId} as group_id`,
            `${DB_COLS.items.key} as key`,
            `${DB_COLS.items.label} as label`,
            `${DB_COLS.items.unit} as unit`,
            `${DB_COLS.items.sort} as sort_order`,
          ].join(','))
          .order(DB_COLS.items.sort, { ascending: true, nullsFirst: false })
          .order(DB_COLS.items.label, { ascending: true });
        if (iErr) throw iErr;

        if (!active) return;

        const groupsArr = (gData ?? []) as Group[];
        const itemsArr = (iData ?? []) as Item[];

        const byGroup: Record<UUID, Item[]> = {};
        for (const it of itemsArr) {
          if (!byGroup[it.group_id]) byGroup[it.group_id] = [];
          byGroup[it.group_id].push(it);
        }

        setGroups(groupsArr);
        setItemsByGroup(byGroup);
      } catch (e) {
        console.error('Erreur chargement structure', e);
      } finally {
        if (active) setLoadingStructure(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // Charger toutes les motos (+ brands) une fois, puis filtrer côté client
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: mData, error: mErr } = await supabase
          .from(DB_COLS.motos.table)
          .select([
            `${DB_COLS.motos.id} as id`,
            `${DB_COLS.motos.brandId} as brand_id`,
            `${DB_COLS.motos.model} as model_name`,
            `${DB_COLS.motos.year} as year`,
          ].join(','))
          .limit(2000);
        if (mErr) throw mErr;

        const motos = (mData ?? []) as MotoRow[];
        if (!active) return;

        setAllMotos(motos);

        const brandIds = Array.from(new Set(motos.map(m => m.brand_id).filter(Boolean))) as string[];
        if (brandIds.length > 0) {
          const { data: bData, error: bErr } = await supabase
            .from(DB_COLS.brands.table)
            .select([`${DB_COLS.brands.id} as id`, `${DB_COLS.brands.name} as name`].join(','))
            .in(DB_COLS.brands.id, brandIds);
          if (bErr) throw bErr;
          const map = Object.fromEntries((bData ?? []).map((b: any) => [b.id, b.name]));
          if (active) setBrandMap(map);
        }
      } catch (e) {
        console.error('Erreur chargement motos/brands', e);
      }
    })();
    return () => { active = false; };
  }, []);

  // Options filtrées (search)
  const motoOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    let opts: MotoMeta[] = allMotos.map(m => ({
      id: m.id,
      brand_name: m.brand_id ? (brandMap[m.brand_id] ?? null) : null,
      model_name: m.model_name,
      year: m.year,
    }));
    if (q) {
      opts = opts.filter(o =>
        (o.brand_name ?? '').toLowerCase().includes(q) ||
        (o.model_name ?? '').toLowerCase().includes(q) ||
        String(o.year ?? '').includes(q)
      );
    }
    // Tri léger: brand, model, year
    opts.sort((a, b) => {
      const A = `${a.brand_name ?? ''} ${a.model_name} ${a.year ?? ''}`.toLowerCase();
      const B = `${b.brand_name ?? ''} ${b.model_name} ${b.year ?? ''}`.toLowerCase();
      return A.localeCompare(B);
    });
    return opts.slice(0, 200);
  }, [allMotos, brandMap, search]);

  // Maintenir motoMetaMap pour les IDs sélectionnés (pour entêtes colonnes)
  useEffect(() => {
    if (selectedMotoIds.length === 0) return;
    const newEntries: Record<UUID, MotoMeta> = {};
    for (const id of selectedMotoIds) {
      if (!motoMetaMap[id]) {
        const row = allMotos.find(m => m.id === id);
        if (row) {
          newEntries[id] = {
            id,
            brand_name: row.brand_id ? (brandMap[row.brand_id] ?? null) : null,
            model_name: row.model_name,
            year: row.year,
          };
        }
      }
    }
    if (Object.keys(newEntries).length > 0) {
      setMotoMetaMap(prev => ({ ...prev, ...newEntries }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMotoIds, allMotos, brandMap]);

  // Charger valeurs pour les motos sélectionnées (batch)
  useEffect(() => {
    let active = true;
    (async () => {
      if (selectedMotoIds.length === 0) { setValuesMap({}); return; }
      try {
        const { data, error } = await supabase
          .from(DB_COLS.values.table)
          .select([
            `${DB_COLS.values.motoId} as moto_id`,
            `${DB_COLS.values.itemId} as item_id`,
            `${DB_COLS.values.vText} as value_text`,
            `${DB_COLS.values.vNum} as value_number`,
            `${DB_COLS.values.vBool} as value_boolean`,
            `${DB_COLS.values.vJson} as value_json`,
          ].join(','))
          .in(DB_COLS.values.motoId, selectedMotoIds);
        if (error) throw error;

        const map: Record<UUID, Record<UUID, ValueCell>> = {};
        for (const row of (data ?? [])) {
          const mid: UUID = row.moto_id;
          const iid: UUID = row.item_id;
          if (!map[mid]) map[mid] = {};
          map[mid][iid] = {
            value_text: row.value_text,
            value_number: row.value_number,
            value_boolean: row.value_boolean,
            value_json: row.value_json,
          };
        }
        if (active) setValuesMap(map);
      } catch (e) {
        console.error('Erreur chargement valeurs', e);
      }
    })();
    return () => { active = false; };
  }, [selectedMotoIds]);

  const allBlocks = useMemo(() => {
    // [{ group, items: Item[] }]
    return groups.map(g => ({
      group: g,
      items: (itemsByGroup[g.id] ?? []),
    })).filter(block => block.items.length > 0);
  }, [groups, itemsByGroup]);

  const addMoto = (id: UUID) => {
    setSelectedMotoIds(prev => {
      if (prev.includes(id)) return prev;
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  };
  const removeMoto = (id: UUID) => setSelectedMotoIds(prev => prev.filter(x => x !== id));

  const formatValue = (v?: ValueCell, unit?: string | null) => {
    if (!v) return '—';
    if (v.value_text != null && `${v.value_text}`.trim() !== '') return v.value_text!;
    if (v.value_number != null) return unit ? `${v.value_number} ${unit}` : String(v.value_number);
    if (v.value_boolean != null) return v.value_boolean ? 'Oui' : 'Non';
    if (v.value_json != null) {
      try { return JSON.stringify(v.value_json); } catch { return '—'; }
    }
    return '—';
  };

  return (
    <div className="min-h-screen w-full">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-semibold">Comparateur de motos</h1>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une moto (marque, modèle, année)"
            className="border rounded-xl px-3 py-2 text-sm w-80"
            aria-label="Rechercher une moto"
          />
          <div className="flex gap-2 overflow-x-auto">
            {motoOptions.slice(0, 10).map(opt => (
              <button
                key={opt.id}
                onClick={() => addMoto(opt.id)}
                className="border rounded-xl px-3 py-1 text-xs hover:shadow"
                title="Ajouter cette moto"
              >
                {(opt.brand_name ?? '—') + ' — ' + opt.model_name + (opt.year ? ` ${opt.year}` : '')}
              </button>
            ))}
          </div>
          <div className="ml-auto text-xs text-gray-500">Sélection: {selectedMotoIds.length}/5</div>
        </div>
      </header>

      <main className="px-4 py-4">
        {loadingStructure ? (
          <div className="text-sm text-gray-500">Chargement des caractéristiques…</div>
        ) : allBlocks.length === 0 ? (
          <div className="text-sm text-gray-500">Aucune caractéristique définie dans la base.</div>
        ) : (
          <div className="relative overflow-x-auto">
            <div
              className="inline-grid w-full"
              style={{
                gridTemplateColumns: `minmax(320px, 1fr) repeat(${Math.max(selectedMotoIds.length, 1)}, minmax(220px, 1fr))`,
              }}
            >
              {/* Header row */}
              <div className="sticky left-0 z-10 bg-white/90 backdrop-blur border-b px-3 py-2 font-medium">
                Caractéristiques
              </div>
              {selectedMotoIds.length > 0 ? (
                selectedMotoIds.map((id) => {
                  const meta = motoMetaMap[id];
                  return (
                    <div key={id} className="border-b px-3 py-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate" title={`${meta?.brand_name ?? '—'} — ${meta?.model_name ?? '—'}`}>
                          {(meta?.brand_name ?? '—') + ' — ' + (meta?.model_name ?? '—')}
                        </div>
                        <div className="text-[11px] text-gray-500">{meta?.year ?? ''}</div>
                      </div>
                      <button
                        onClick={() => removeMoto(id)}
                        className="text-gray-500 hover:text-red-600 text-sm border rounded px-2 py-1"
                        title="Retirer cette moto"
                        aria-label="Retirer cette moto"
                      >
                        ×
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="border-b px-3 py-2 text-sm text-gray-400">Choisis au moins une moto ↑</div>
              )}

              {/* Body */}
              {allBlocks.map(block => (
                <React.Fragment key={block.group.id}>
                  {/* Group header spanning all columns */}
                  <div className="col-span-full bg-gray-50 border-y px-3 py-2 font-semibold">
                    {block.group.name}
                  </div>

                  {/* For each item row: first column = item label, following columns = values by moto */}
                  {block.items.map(item => (
                    <React.Fragment key={item.id}>
                      {/* Sticky item cell (left) */}
                      <div className="sticky left-0 z-10 bg-white border-b px-3 py-2">
                        <div className="text-sm font-medium" title={item.label}>{item.label}</div>
                        {item.unit ? <div className="text-[11px] text-gray-500">{item.unit}</div> : null}
                      </div>

                      {/* Values for each selected moto */}
                      {selectedMotoIds.length > 0 ? (
                        selectedMotoIds.map(mid => {
                          const v = valuesMap[mid]?.[item.id];
                          return (
                            <div key={`${mid}-${item.id}`} className="border-b px-3 py-2 text-sm" title={formatValue(v, item.unit)}>
                              {formatValue(v, item.unit)}
                            </div>
                          );
                        })
                      ) : (
                        <div className="border-b px-3 py-2 text-sm text-gray-400">—</div>
                      )}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/*** FIN DU FICHIER ***/
