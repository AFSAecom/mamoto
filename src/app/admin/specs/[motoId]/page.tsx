'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabaseClient';

type Spec = {
  id: string;
  moto_id: string;
  category: string | null;
  subcategory: string | null;
  key_name: string;
  value_text: string | null;
  unit: string | null;
  sort_order: number | null;
  created_at: string;
};

type Moto = {
  id: string;
  brand: string;
  model: string;
};

export default function MotoSpecsPage() {
  const params = useParams();
  const router = useRouter();
  const motoId = String(params.motoId);

  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [guarded, setGuarded] = useState(false);

  const [moto, setMoto] = useState<Moto | null>(null);
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Formulaire (nouvelle ligne)
  const [form, setForm] = useState<Partial<Spec>>({
    category: '',
    subcategory: '',
    key_name: '',
    value_text: '',
    unit: '',
    sort_order: 0,
  });

  // Édition inline (par id)
  const [editing, setEditing] = useState<Record<string, Partial<Spec>>>({});

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setError('Supabase non configuré');
      setLoading(false);
      return;
    }
    setSupabase(client);
  }, []);

  // Guard admin
  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/admin/login'); return; }
      const { data: allowed } = await supabase.rpc('is_admin');
      if (!allowed) { setError('Accès refusé (non-admin)'); return; }
      setGuarded(true);
      setLoading(false);
    })();
  }, [router, supabase]);

  // Charger moto + specs
  useEffect(() => {
    if (!guarded || !supabase) return;
    (async () => {
      await loadMoto();
      await loadSpecs();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guarded, supabase]);

  const loadMoto = async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('motos')
      .select('id, brand, model')
      .eq('id', motoId)
      .single();
    if (!error && data) setMoto(data as Moto);
  };

  const loadSpecs = async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('moto_specs')
      .select('*')
      .eq('moto_id', motoId)
      .order('category', { ascending: true, nullsFirst: true })
      .order('subcategory', { ascending: true, nullsFirst: true })
      .order('sort_order', { ascending: true, nullsFirst: true });
    if (error) { setError(error.message); return; }
    setSpecs((data ?? []) as Spec[]);
  };

  const groups = useMemo(() => {
    // Regroupe par (category -> subcategory)
    const map = new Map<string, { category: string; subcategory: string; items: Spec[] }>();
    for (const s of specs) {
      const cat = s.category ?? '';
      const sub = s.subcategory ?? '';
      const key = `${cat}__${sub}`;
      if (!map.has(key)) map.set(key, { category: cat, subcategory: sub, items: [] });
      map.get(key)!.items.push(s);
    }
    return Array.from(map.values());
  }, [specs]);

  const updateEditing = (id: string, patch: Partial<Spec>) => {
    setEditing(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const onCreate = async () => {
    if (!supabase) return;
    setError(null);
    if (!form.key_name) { setError('Le champ "key_name" est obligatoire.'); return; }
    const payload = {
      moto_id: motoId,
      category: (form.category ?? '') || null,
      subcategory: (form.subcategory ?? '') || null,
      key_name: form.key_name ?? '',
      value_text: (form.value_text ?? '') || null,
      unit: (form.unit ?? '') || null,
      sort_order: form.sort_order ?? 0,
    };
    const { error } = await supabase.from('moto_specs').insert(payload);
    if (error) { setError(error.message); return; }
    setForm({ category: '', subcategory: '', key_name: '', value_text: '', unit: '', sort_order: 0 });
    await loadSpecs();
  };

  const onSaveRow = async (row: Spec) => {
    if (!supabase) return;
    setError(null);
    const patch = editing[row.id] ?? {};
    if (!patch || Object.keys(patch).length === 0) return;
    const payload = {
      category: (patch.category ?? row.category) || null,
      subcategory: (patch.subcategory ?? row.subcategory) || null,
      key_name: (patch.key_name ?? row.key_name) || '',
      value_text: (patch.value_text ?? row.value_text) || null,
      unit: (patch.unit ?? row.unit) || null,
      sort_order: (patch.sort_order ?? row.sort_order) ?? 0,
    };
    const { error } = await supabase.from('moto_specs').update(payload).eq('id', row.id);
    if (error) { setError(error.message); return; }
    setEditing(prev => {
      const { [row.id]: _, ...rest } = prev; // remove edited cache
      return rest;
    });
    await loadSpecs();
  };

  const onDeleteRow = async (row: Spec) => {
    if (!supabase) return;
    if (!confirm('Supprimer cette caractéristique ?')) return;
    const { error } = await supabase.from('moto_specs').delete().eq('id', row.id);
    if (error) { alert(error.message); return; }
    await loadSpecs();
  };

  const onBack = () => router.push('/admin');

  if (loading) return <main className="p-6">Chargement…</main>;
  if (error) return <main className="p-6 text-red-600">{error}</main>;
  if (!guarded) return null;

  return (
    <main className="p-6 space-y-8">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Caractéristiques — {moto ? `${moto.brand} ${moto.model}` : ''}</h1>
          <button onClick={onBack} className="rounded-2xl border px-3 py-1 text-sm">← Retour à l’admin</button>
        </div>
      </header>

      {/* Créer une nouvelle caractéristique */}
      <section className="rounded-2xl border p-4 space-y-3 bg-white">
        <h2 className="font-medium">Ajouter une ligne</h2>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <input className="border rounded px-3 py-2" placeholder="Catégorie" value={form.category ?? ''} onChange={e=>setForm(f=>({...f, category:e.target.value}))}/>
          <input className="border rounded px-3 py-2" placeholder="Sous-catégorie" value={form.subcategory ?? ''} onChange={e=>setForm(f=>({...f, subcategory:e.target.value}))}/>
          <input className="border rounded px-3 py-2 md:col-span-2" placeholder="Nom de la clé (key_name)*" value={form.key_name ?? ''} onChange={e=>setForm(f=>({...f, key_name:e.target.value}))}/>
          <input className="border rounded px-3 py-2" placeholder="Valeur" value={form.value_text ?? ''} onChange={e=>setForm(f=>({...f, value_text:e.target.value}))}/>
          <input className="border rounded px-3 py-2" placeholder="Unité (ex: cc, kg, mm…)" value={form.unit ?? ''} onChange={e=>setForm(f=>({...f, unit:e.target.value}))}/>
          <input className="border rounded px-3 py-2" placeholder="Ordre" type="number" value={form.sort_order ?? 0} onChange={e=>setForm(f=>({...f, sort_order:e.target.value ? Number(e.target.value): 0}))}/>
        </div>
        <div className="flex gap-2">
          <button onClick={onCreate} className="rounded-2xl border px-4 py-2">Ajouter</button>
        </div>
        <p className="text-xs text-gray-500">* <strong>key_name</strong> est obligatoire (ex: “Cylindrée”).</p>
      </section>

      {/* Liste groupée par Catégorie / Sous-catégorie */}
      <section className="rounded-2xl border bg-white">
        {groups.length === 0 ? (
          <div className="p-4 text-sm text-gray-600">Aucune caractéristique pour le moment.</div>
        ) : (
          <div className="divide-y">
            {groups.map((g, gi) => (
              <div key={gi} className="p-4">
                <div className="mb-3">
                  <h3 className="text-lg font-medium">
                    {g.category || <span className="italic text-gray-500">Sans catégorie</span>}
                    {g.subcategory ? <span className="text-gray-500"> / {g.subcategory}</span> : null}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Clé</th>
                        <th className="text-left p-2">Valeur</th>
                        <th className="text-left p-2">Unité</th>
                        <th className="text-left p-2">Ordre</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.items.map(row => {
                        const draft = editing[row.id] ?? {};
                        return (
                          <tr key={row.id} className="border-b align-top">
                            <td className="p-2">
                              <input className="border rounded px-2 py-1 w-full"
                                defaultValue={row.key_name}
                                onChange={e=>updateEditing(row.id, { key_name: e.target.value })}
                              />
                              <div className="grid grid-cols-2 gap-2 mt-1">
                                <input className="border rounded px-2 py-1" placeholder="Catégorie"
                                  defaultValue={row.category ?? ''}
                                  onChange={e=>updateEditing(row.id, { category: e.target.value })}
                                />
                                <input className="border rounded px-2 py-1" placeholder="Sous-catégorie"
                                  defaultValue={row.subcategory ?? ''}
                                  onChange={e=>updateEditing(row.id, { subcategory: e.target.value })}
                                />
                              </div>
                            </td>
                            <td className="p-2">
                              <textarea className="border rounded px-2 py-1 w-full"
                                rows={2}
                                defaultValue={row.value_text ?? ''}
                                onChange={e=>updateEditing(row.id, { value_text: e.target.value })}
                              />
                            </td>
                            <td className="p-2">
                              <input className="border rounded px-2 py-1 w-28"
                                defaultValue={row.unit ?? ''}
                                onChange={e=>updateEditing(row.id, { unit: e.target.value })}
                              />
                            </td>
                            <td className="p-2">
                              <input className="border rounded px-2 py-1 w-20" type="number"
                                defaultValue={row.sort_order ?? 0}
                                onChange={e=>updateEditing(row.id, { sort_order: e.target.value ? Number(e.target.value) : 0 })}
                              />
                            </td>
                            <td className="p-2 space-x-2 whitespace-nowrap">
                              <button className="border rounded px-2 py-1" onClick={()=>onSaveRow(row)}>Enregistrer</button>
                              <button className="border rounded px-2 py-1" onClick={()=>onDeleteRow(row)}>Supprimer</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

