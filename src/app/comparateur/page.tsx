'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type Brand = { id: string; name: string };
type Model = { id: string; name: string; brand_id: string };
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
  const [models, setModels] = useState<Model[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [items, setItems] = useState<Moto[]>([]);

  // 1) Charger les marques
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

  // 2) Charger les modèles filtrés par brand_id
  useEffect(() => {
    if (!selectedBrandId) {
      setModels([]);
      setSelectedModelId('');
      return;
    }
    (async () => {
      setError('');
      const { data, error } = await supabase
        .from('models')
        .select('id,name,brand_id')
        .eq('brand_id', selectedBrandId)
        .order('name', { ascending: true });
      if (error) return setError(error.message);
      setModels(data ?? []);
      setSelectedModelId('');
    })();
  }, [selectedBrandId]);

  // 3) Ajouter la moto choisie
  const onCompare = async () => {
    setError('');
    if (!selectedBrandId || !selectedModelId) {
      setError("Choisis d'abord une marque et un modèle.");
      return;
    }

    // récupérer le modèle choisi (pour son nom)
    const model = models.find((m) => m.id === selectedModelId);
    if (!model) {
      setError("Modèle introuvable.");
      return;
    }

    // IMPORTANT : filtrer par brand_id ET par model_name (et éventuellement année si tu as un champ year choisi)
    const { data, error } = await supabase
      .from('motos')
      .select('id,brand_id,model_name,year,price_tnd')
      .eq('brand_id', selectedBrandId)
      .eq('model_name', model.name)
      .limit(1)
      .maybeSingle();

    if (error) {
      setError(error.message);
      return;
    }
    if (!data) {
      setError("Aucune moto trouvée pour cette marque et ce modèle.");
      return;
    }

    // éviter les doublons dans la liste à comparer
    setItems((prev) =>
      prev.some((x) => x.id === data.id) ? prev : [...prev, data]
    );
  };

  const reset = () => {
    setSelectedBrandId('');
    setSelectedModelId('');
    setModels([]);
    setError('');
    setItems([]);
  };

  const ready = useMemo(() => !!selectedBrandId && !!selectedModelId, [selectedBrandId, selectedModelId]);

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

        {/* Modèle */}
        <div>
          <label className="block text-sm mb-1">Modèle</label>
          <select
            className="w-full rounded-md border px-3 py-2 bg-white text-black"
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
            disabled={!selectedBrandId}
          >
            <option value="">{selectedBrandId ? 'Sélectionner…' : 'Choisis une marque d’abord'}</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
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

      {/* Liste des motos ajoutées */}
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
