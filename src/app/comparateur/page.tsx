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
   const [models, setModels] = useState<Moto[]>([]);
   const [selectedBrand, setSelectedBrand] = useState<string>('');
   const [selectedMotoId, setSelectedMotoId] = useState<string>('');
   const [specMap, setSpecMap] = useState<Record<string, SpecValue>>({});
   const [loading, setLoading] = useState(true);
   const [loadingModels, setLoadingModels] = useState(false);
   const [loadingValues, setLoadingValues] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
   const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
   const supabase = useMemo(() => {
     if (!url || !anon) return null;
     return createClient(url, anon);
   }, [url, anon]);

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

   const selectedMoto = useMemo(
     () => models.find((m) => m.id === selectedMotoId) || null,
     [models, selectedMotoId]
   );

   const handleBrandChange = async (id: string) => {
     setSelectedBrand(id);
     setSelectedMotoId('');
     setModels([]);
     setSpecMap({});
     if (!id || !supabase) return;
     setLoadingModels(true);
     try {
       const res = await supabase
         .from('motos')
         .select('id,model_name,year,brand_name')
         .eq('brand_id', id);
       if (res.error) throw res.error;
       setModels(res.data ?? []);
     } catch (e: any) {
       setError(e.message ?? 'Erreur inattendue');
     } finally {
       setLoadingModels(false);
     }
   };

   const handleModelChange = async (id: string) => {
     setSelectedMotoId(id);
     setSpecMap({});
     if (!id || !supabase) return;
     setLoadingValues(true);
     try {
       const res = await supabase
         .from('moto_spec_values')
         .select(
           'moto_id,spec_item_id,value_text,value_number,value_boolean,value_json,unit_override'
         )
         .eq('moto_id', id);
       if (res.error) throw res.error;
       const map: Record<string, SpecValue> = {};
       for (const row of res.data ?? []) {
         map[row.spec_item_id] = {
           value_text: row.value_text,
           value_number: row.value_number,
           value_boolean: row.value_boolean,
           value_json: row.value_json,
           unit_override: row.unit_override,
         };
       }
       setSpecMap(map);
     } catch (e: any) {
       setError(e.message ?? 'Erreur inattendue');
     } finally {
       setLoadingValues(false);
     }
   };

   const renderValue = (item: SpecItem) => {
     const v = specMap[item.id];
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

   if (loading) return <div className="p-4">Chargement…</div>;
   if (error) return <div className="p-4 text-red-500">{error}</div>;
   if (groups.length === 0)
     return <div className="p-4">Aucune caractéristique définie.</div>;

  const rightHeader = !selectedBrand
    ? 'Choisis une marque, puis un modèle.'
    : !selectedMoto
    ? 'Choisis un modèle.'
    : loadingValues
    ? 'Chargement…'
    : error
    ? 'Erreur de chargement'
    : `${selectedMoto.brand_name ||
        brands.find((b) => b.id === selectedBrand)?.name || ''} — ${
        selectedMoto.model_name
      }${selectedMoto.year ? ` ${selectedMoto.year}` : ''}`;

   return (
     <div className="p-4 space-y-4">
       <div className="flex gap-4 sticky top-0 bg-background py-2">
         <select
           aria-label="Marque"
           value={selectedBrand}
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
           value={selectedMotoId}
           onChange={(e) => handleModelChange(e.target.value)}
           disabled={!selectedBrand || loadingModels}
           className="border p-2 rounded"
         >
           <option value="">Sélectionner un modèle</option>
           {models.map((m) => (
             <option key={m.id} value={m.id}>
               {m.model_name}
               {m.year ? ` ${m.year}` : ''}
             </option>
           ))}
         </select>
       </div>
       <div className="overflow-auto">
         <table className="min-w-full text-sm">
           <thead className="sticky top-0 bg-background">
             <tr>
               <th className="text-left p-2 sticky left-0 bg-background z-10">
                 Spécifications
               </th>
               <th className="text-left p-2">{rightHeader}</th>
             </tr>
           </thead>
           <tbody>
             {groups.map((group) => (
               <Fragment key={group.id}>
                 <tr className="bg-muted font-semibold">
                   <th
                     colSpan={2}
                     className="text-left p-2 sticky left-0 bg-muted z-10"
                   >
                     {group.name}
                   </th>
                 </tr>
                 {itemsByGroup[group.id]?.length ? (
                   itemsByGroup[group.id].map((item) => {
                     const value = renderValue(item);
                     return (
                       <tr key={item.id} className="border-b">
                         <th className="text-left p-2 font-medium sticky left-0 bg-background z-10">
                           {item.label}
                           {item.unit && (
                             <span className="ml-1 text-xs text-muted-foreground">
                               {item.unit}
                             </span>
                           )}
                         </th>
                         <td className="p-2" title={value}>
                           {value}
                         </td>
                       </tr>
                     );
                   })
                 ) : (
                   <tr className="border-b">
                     <th className="italic text-muted-foreground p-2 text-left sticky left-0 bg-background z-10">
                       — Aucune sous-caractéristique —
                     </th>
                     <td className="p-2">—</td>
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

