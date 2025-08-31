'use client';

// Comparateur page using `motos` table instead of non-existing `public.models`
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type Brand = { id: string; name: string };
type Moto = {
  id: string;
  brand_id: string;
  model_name: string;
  year: number | null;
  price_tnd: string | number | null;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export default function ComparatorPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<string[]>([]); // valeurs de model_name
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [selectedModelName, setSelectedModelName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [items, setItems] = useState<Moto[]>([]);

  // Charger les marques
  useEffect(() => {
    (async () => {
      setError('');
      const { data, error } = await supabase
        .from('brands')
        .select('id,name')
        .order('name', { ascending: true });
      if (error) return setError(error.message);
      setBrands(data ?? []);
    })();
  }, []);

  // Charger les modèles (depuis `motos`, distinct par brand_id)
  useEffect(() => {
    if (!selectedBrandId) {
      setModels([]);
      setSelectedModelName('');
      return;
    }
    (async () => {
      setError('');
      const { data, error } = await supabase
        .from('motos')
        .select('model_name')
        .eq('brand_id', selectedBrandId)
        .not('model_name', 'is', null)
        .order('model_name', { ascending: true });

      if (error) return setError(error.message);

      // dédoublonner côté client
      const unique = Array.from(
        new Set((data ?? []).map((r: any) => String(r.model_name)))
      );
      setModels(unique);
      setSelectedModelName('');
    })();
  }, [selectedBrandId]);

  // Ajouter la moto choisie
  const onCompare = async () => {
    setError('');
    if (!selectedBrandId || !selectedModelName) {
      setError("Choisis d'abord une marque et un modèle.");
      return;
    }

    const { data, error } = await supabase
      .from('motos')
      .select('id,brand_id,model_name,year,price_tnd')
      .eq('brand_id', selectedBrandId)
      .eq('model_name', selectedModelName)
      .limit(1)
      .maybeSingle();

    if (error) return setError(error.message);
    if (!data) return setError("Aucune moto trouvée pour cette marque et ce modèle.");

    setItems((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data]));
  };

  const reset = () => {
    setSelectedBrandId('');
    setSelectedModelName('');
    setModels([]);
    setError('');
    setItems([]);
  };

  const ready = useMemo(
    () => !!selectedBrandId && !!selectedModelName,
    [selectedBrandId, selectedModelName]
  );

  return (
    <div className="mx-auto max-w-4xl p-4">
      <h1 className="text-2xl font-semibold mb-6">Comparateur de motos</h1>

      <div className="grid md:grid-cols-3 gap-3 items-end">
        {/* Marque */}
        <div>
          <label className="block text-sm mb-1">Marque</label>
          <select
            className="w-full rounded-md border px-3 py-2 bg-white text-black"
            value={selectedBrandId}
            onChange={(e) => setSelectedBrandId(e.target.value)}
          >
            <option value="">Sélectionner…</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Modèle (depuis motos.model_name) */}
        <div>
          <label className="block text-sm mb-1">Modèle</label>
          <select
            className="w-full rounded-md border px-3 py-2 bg-white text-black"
            value={selectedModelName}
            onChange={(e) => setSelectedModelName(e.target.value)}
            disabled={!selectedBrandId}
          >
            <option value="">
              {selectedBrandId ? 'Sélectionner…' : 'Choisis une marque d’abord'}
            </option>
            {models.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onCompare}
            disabled={!ready}
            className="rounded-md px-4 py-2 bg-emerald-600 text-white disabled:opacity-50"
          >
            Comparer
          </button>
          <button
            onClick={reset}
            className="rounded-md px-4 py-2 bg-gray-700 text-white"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 mt-3">{error}</p>}

      {/* Résultats */}
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        {items.map((m) => (
          <div key={m.id} className="rounded-xl border p-4 bg-white text-black">
            <div className="font-medium">{m.model_name}</div>
            <div className="text-sm opacity-80">Année: {m.year ?? '—'}</div>
            <div className="text-sm opacity-80">Prix: {m.price_tnd ?? '—'} TND</div>
          </div>
        ))}
      </div>
    </div>
  );
}

