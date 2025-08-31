/*** 
PROMPT CODEX — ÉTAPE 1 (Affichage colonne de gauche : Catégories + Sous-catégories)

Objectif :
- Créer/ÉCRASER le fichier : app/comparateur/page.tsx (Next.js App Router, TypeScript, Client Component).
- À l’ouverture de la page, afficher à GAUCHE toute la liste des caractéristiques : 
  => Catégorie (table: spec_groups) puis, en dessous, ses sous-caractéristiques (table: spec_items).
- Ordre d’affichage : par `spec_groups.sort_order NULLS LAST, name` puis `spec_items.sort_order NULLS LAST, label`.

Données dans Supabase (adapter uniquement si votre schéma diffère) :
- Table `spec_groups` : colonnes -> id, name, sort_order
- Table `spec_items`  : colonnes -> id, group_id, key, label, unit, sort_order

Requis :
- Variables d’env : NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY
- Utilise @supabase/supabase-js côté client
- La droite de la page reste un simple placeholder “(valeurs à venir)”

Collez TOUT ce bloc tel quel.
***/

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

// ----------------------- CONFIG DES NOMS DE COLONNES (adaptez ici si besoin) -----------------------
const DB_COLS = {
  groups: { table: 'spec_groups', id: 'id', name: 'name', sort: 'sort_order' },
  items:  { table: 'spec_items',  id: 'id', groupId: 'group_id', key: 'key', label: 'label', unit: 'unit', sort: 'sort_order' },
};
// ---------------------------------------------------------------------------------------------------

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = (supabaseUrl && supabaseAnon) ? createClient(supabaseUrl, supabaseAnon) : null;

export default function ComparatorLeftOnly() {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [itemsByGroup, setItemsByGroup] = useState<Record<UUID, Item[]>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Vérification env
  useEffect(() => {
    if (!supabase) {
      setErrorMsg('Variables d’environnement manquantes : NEXT_PUBLIC_SUPABASE_URL et/ou NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      setLoading(false);
    }
  }, []);

  // Chargement catégories + sous-catégories
  useEffect(() => {
    if (!supabase) return;
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        // 1) Catégories (spec_groups)
        const { data: gData, error: gErr } = await supabase
          .from(DB_COLS.groups.table)
          .select(`${DB_COLS.groups.id} as id, ${DB_COLS.groups.name} as name, ${DB_COLS.groups.sort} as sort_order`)
          .order(DB_COLS.groups.sort, { ascending: true, nullsFirst: false })
          .order(DB_COLS.groups.name, { ascending: true });
        if (gErr) throw gErr;

        // 2) Sous-caractéristiques (spec_items)
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

        if (!mounted) return;

        const groupsArr = (gData ?? []) as Group[];
        const itemsArr = (iData ?? []) as Item[];

        // Regrouper les items par group_id
        const byGroup: Record<UUID, Item[]> = {};
        for (const it of itemsArr) {
          if (!byGroup[it.group_id]) byGroup[it.group_id] = [];
          byGroup[it.group_id].push(it);
        }

        setGroups(groupsArr);
        setItemsByGroup(byGroup);
      } catch (e: any) {
        console.error('Erreur chargement', e);
        setErrorMsg(e?.message ?? 'Erreur inconnue lors du chargement des caractéristiques.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  // Liste ordonnée Catégorie -> Items
  const blocks = useMemo(() => {
    return groups.map(g => ({
      group: g,
      items: (itemsByGroup[g.id] ?? []),
    }));
  }, [groups, itemsByGroup]);

  return (
    <div className="min-h-screen w-full grid grid-cols-[360px_minmax(0,1fr)]">
      {/* Colonne GAUCHE : Catégories + Sous-catégories */}
      <aside className="border-r bg-white sticky top-0 self-start h-screen overflow-y-auto px-4 py-4">
        <h1 className="text-lg font-semibold mb-3">Caractéristiques techniques</h1>

        {loading ? (
          <div className="text-sm text-gray-500">Chargement…</div>
        ) : errorMsg ? (
          <div className="text-sm text-red-600">{errorMsg}</div>
        ) : blocks.length === 0 ? (
          <div className="text-sm text-gray-500">Aucune caractéristique définie.</div>
        ) : (
          <div className="space-y-4">
            {blocks.map(block => (
              <section key={block.group.id} className="rounded-lg border">
                <div className="px-3 py-2 bg-gray-50 border-b font-medium">
                  {block.group.name}
                </div>
                <ul className="divide-y">
                  {block.items.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-gray-500">— Aucune sous-caractéristique —</li>
                  ) : block.items.map(it => (
                    <li key={it.id} className="px-3 py-2">
                      <div className="text-sm font-normal" title={it.label}>{it.label}</div>
                      {it.unit ? (
                        <div className="text-[11px] text-gray-500">{it.unit}</div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </aside>

      {/* Colonne DROITE : Placeholder (valeurs à venir) */}
      <main className="px-6 py-6">
        <div className="text-sm text-gray-500">
          Zone comparateur (valeurs des motos) — <span className="italic">à venir à l’étape suivante</span>.
        </div>
      </main>
    </div>
  );
}

