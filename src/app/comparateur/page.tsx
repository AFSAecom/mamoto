'use client';

import { useEffect, useMemo, useState } from 'react';
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

export default function ComparatorPage() {
  const [groups, setGroups] = useState<SpecGroup[]>([]);
  const [items, setItems] = useState<SpecItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anon) {
      setError('Variables NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY manquantes.');
      setLoading(false);
      return;
    }

    const supabase = createClient(url, anon);

    (async () => {
      try {
        const [groupsRes, itemsRes] = await Promise.all([
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
        ]);

        if (groupsRes.error) throw groupsRes.error;
        if (itemsRes.error) throw itemsRes.error;

        setGroups(groupsRes.data ?? []);
        setItems(itemsRes.data ?? []);
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

  if (loading) return <div className="p-4">Chargement…</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (groups.length === 0) return <div className="p-4">Aucune caractéristique définie.</div>;

  return (
    <div className="grid md:grid-cols-2 gap-6 p-4">
      <div>
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
      <div>(valeurs à venir)</div>
    </div>
  );
}

