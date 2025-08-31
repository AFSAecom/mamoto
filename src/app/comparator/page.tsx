'use client';
// Moto comparator page

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

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

export default function ComparatorPage() {
  const [brands, setBrands] = useState<string[]>([]);
  const [brand, setBrand] = useState<string>('');
  const [motoOptions, setMotoOptions] = useState<MotoRow[]>([]);
  const [selected, setSelected] = useState<MotoRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [table, setTable] = useState<ComparatorPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/motos/brands');
      const json = await res.json();
      if (res.ok && Array.isArray(json?.brands)) setBrands(json.brands);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setMotoOptions([]);
      if (!brand) return;
      const res = await fetch('/api/motos/by-brand', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ brand }),
      });
      const json = await res.json();
      if (!res.ok) return;

      const rows = (json?.motos ?? []) as any[];
      const opts: MotoRow[] = rows.map((m) => ({
        id: m.id,
        brand: m.brand ?? m.marque ?? m.make ?? null,
        model: m.model ?? m.modele ?? m.model_name ?? null,
        year: m.year ?? null,
        price: m.price_tnd ?? m.price ?? null,
        image: m.display_image ?? m.image_url ?? m.cover_image ?? m.image ?? null,
      }));
      setMotoOptions(opts);
    })();
  }, [brand]);

  const canAddMore = selected.length < 4;

  const addMoto = (id: string) => {
    if (!canAddMore) return;
    const m = motoOptions.find((o) => o.id === id);
    if (!m) return;
    if (selected.some((s) => s.id === id)) return;
    setSelected((prev) => [...prev, m]);
    setTable(null);
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
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Marque</label>
          <select
            className="border rounded-xl px-3 py-2"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          >
            <option value="">-- Choisir une marque --</option>
            {brands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Modèle</label>
          <select
            className="border rounded-xl px-3 py-2"
            disabled={!brand || motoOptions.length === 0 || !canAddMore}
            onChange={(e) => {
              const id = e.target.value;
              if (id) addMoto(id);
              e.currentTarget.selectedIndex = 0;
            }}
          >
            <option value="">{brand ? '— Ajouter un modèle —' : 'Sélectionne une marque'}</option>
            {motoOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {`${m.model ?? 'Modèle'}${m.year ? ` (${m.year})` : ''}`}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={compareNow}
            disabled={loading || selected.length < 2}
            className="rounded-xl px-4 py-2 bg-black text-white disabled:opacity-50"
          >
            {loading ? 'Chargement…' : 'Comparer'}
          </button>
          <button
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
