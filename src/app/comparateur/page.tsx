'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import CompareFilters from '@/components/CompareFilters';
import { supabase } from '@/lib/supabaseClient';

type MotoRow = {
  id: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  price: number | null;
  image: string | null;
};

type ComparatorPayload = {
  motos: MotoRow[];
  specs: {
    group: string;
    items: {
      item_id: string;
      key: string;
      label: string;
      unit: string | null;
      values: Record<string, string | null>;
    }[];
  }[];
};

export default function ComparateurPage() {
  const [brandId, setBrandId] = useState<string | null>(null);
  const [selected, setSelected] = useState<MotoRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [table, setTable] = useState<ComparatorPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canAddMore = selected.length < 4;

  const addMotoFromSelection = async (model: string | null) => {
    if (!canAddMore) return;
    if (!brandId || !model) return;
    try {
      const { data, error } = await supabase
        .from('motos')
        .select('id, brand, model, year, price_tnd, display_image, primary_image_path')
        .eq('brand_id', brandId)
        .eq('model', model)
        .order('year', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return;
      const moto: MotoRow = {
        id: data.id,
        brand: (data as any).brand ?? null,
        model: (data as any).model ?? null,
        year: (data as any).year ?? null,
        price: (data as any).price_tnd ?? null,
        image: (data as any).display_image ?? (data as any).primary_image_path ?? null,
      };
      if (selected.some((s) => s.id === moto.id)) return;
      setSelected((prev) => [...prev, moto]);
      setTable(null);
    } catch (e) {
      console.error(e);
      setError("Impossible d'ajouter la moto.");
    }
  };

  const removeMoto = (id: string) => {
    setSelected((prev) => prev.filter((m) => m.id !== id));
    setTable(null);
  };

  const compareNow = async () => {
    setError(null);
    setTable(null);
    if (selected.length < 2) {
      setError('Choisis au moins 2 motos à comparer.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/moto-comparator', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ids: selected.map((s) => s.id) }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error ?? 'Erreur API');
      setTable(json.payload as ComparatorPayload);
    } catch (e: any) {
      setError(e?.message ?? 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(() => table?.motos ?? selected, [table, selected]);
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Comparateur de motos</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div className="md:col-span-2">
          <CompareFilters
            onBrandChange={(v) => setBrandId(v)}
            onModelChange={(m) => addMotoFromSelection(m)}
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={compareNow}
            disabled={loading || selected.length < 2}
            className="rounded-xl px-4 py-2 bg-black text-white disabled:opacity-50"
          >
            {loading ? 'Chargement…' : 'Comparer'}
          </button>
          <button
            type="button"
            onClick={() => { setSelected([]); setTable(null); }}
            className="rounded-xl px-4 py-2 border"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {selected.map((m) => (
          <div key={m.id} className="flex items-center gap-3 border rounded-2xl p-3 shadow-sm">
            <div className="relative h-14 w-20 overflow-hidden rounded-lg bg-gray-50">
              {m.image ? (
                <Image src={m.image} alt={`${m.brand} ${m.model}`} fill className="object-cover" />
              ) : (
                <div className="h-full w-full grid place-items-center text-xs text-gray-400">No image</div>
              )}
            </div>
            <div className="text-sm">
              <div className="font-medium">{m.brand} {m.model}</div>
              <div className="text-gray-500">{m.year ?? ''} {m.price ? `• ${m.price} TND` : ''}</div>
            </div>
            <button
              type="button"
              onClick={() => removeMoto(m.id)}
              className="ml-2 text-sm px-2 py-1 rounded-lg border hover:bg-gray-50"
              title="Retirer"
            >
              ❌
            </button>
          </div>
        ))}
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      {table && (
        <div className="overflow-x-auto border rounded-2xl">
          <table className="min-w-[800px] w-full text-sm">
            <thead className="sticky top-0 bg-white z-10">
              <tr>
                <th className="w-64 text-left p-3">Caractéristiques</th>
                {columns.map((m) => (
                  <th key={m.id} className="p-3 text-left">
                    <div className="flex items-center gap-2">
                      <div className="relative h-10 w-14 overflow-hidden rounded-md bg-gray-50">
                        {m.image ? (
                          <Image src={m.image} alt={`${m.brand} ${m.model}`} fill className="object-cover" />
                        ) : null}
                      </div>
                      <div>
                        <div className="font-medium">{m.brand} {m.model}</div>
                        <div className="text-gray-500">{m.year ?? ''}</div>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.specs.map((g, gi) => (
                <GroupBlock key={gi} group={g} motos={columns} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function GroupBlock({ group, motos }: { group: ComparatorPayload['specs'][number]; motos: MotoRow[] }) {
  return (
    <>
      <tr className="bg-blue-50/60">
        <td className="p-3 font-semibold" colSpan={1 + motos.length}>{group.group}</td>
      </tr>
      {group.items.map((it) => (
        <tr key={it.item_id} className="border-t">
          <td className="p-3">
            <div className="font-medium">{it.label}</div>
            {it.unit ? <div className="text-xs text-gray-500">{it.unit}</div> : null}
          </td>
          {motos.map((m) => (
            <td key={m.id} className="p-3 align-top">{it.values?.[m.id] ?? '—'}</td>
          ))}
        </tr>
      ))}
    </>
  );
}
