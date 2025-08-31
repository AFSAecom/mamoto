import { supabase } from './supabaseClient';

export type MotoFull = {
  moto: { id: string; brand: string; model: string; year: number; price?: number | null; display_image?: string | null } | null;
  images: { id: string; url: string; alt: string | null; is_primary?: boolean | null }[];
  specs: {
    group: string;
    items: {
      key: string;
      label: string;
      unit: string | null;
      value_text?: string | null;
      value_number?: number | null;
      value_boolean?: boolean | null;
      value_json?: any;
    }[];
  }[];
};

export async function getMotoFull(motoId: string): Promise<MotoFull> {
  const { data: moto, error: motoErr } = await supabase
    .from('motos')
    .select('id,brand,model,year,price,display_image')
    .eq('id', motoId)
    .single();
  if (motoErr) throw motoErr;

  if (!moto) return { moto: null, images: [], specs: [] };

  const { data: images, error: imgErr } = await supabase
    .from('moto_images')
    .select('id,url,alt,is_primary,sort_order')
    .eq('moto_id', motoId)
    .order('is_primary', { ascending: false })
    .order('sort_order', { ascending: true });
  if (imgErr) throw imgErr;

  const { data: specRows, error: specErr } = await supabase
    .from('spec_items')
    .select(`
      id,key,label,unit,sort_order,
      spec_groups ( name, sort_order ),
      moto_spec_values!inner ( value_text,value_number,value_boolean,value_json,unit_override )
    `)
    .eq('moto_spec_values.moto_id', motoId);
  if (specErr) throw specErr;

  const grouped: Record<string, { sort: number; items: any[] }> = {};
  (specRows ?? []).forEach((row: any) => {
    const grpName = row.spec_groups?.name ?? 'Autres';
    const grpSort = row.spec_groups?.sort_order ?? 0;
    const val = Array.isArray(row.moto_spec_values)
      ? row.moto_spec_values[0]
      : row.moto_spec_values;
    if (!grouped[grpName]) grouped[grpName] = { sort: grpSort, items: [] };
    grouped[grpName].items.push({
      key: row.key,
      label: row.label,
      unit: val?.unit_override ?? row.unit ?? null,
      value_text: val?.value_text ?? null,
      value_number: val?.value_number ?? null,
      value_boolean: val?.value_boolean ?? null,
      value_json: val?.value_json ?? null,
      sort_order: row.sort_order ?? 0,
    });
  });

  const specs = Object.entries(grouped)
    .sort((a, b) => a[1].sort - b[1].sort || a[0].localeCompare(b[0]))
    .map(([group, info]) => ({
      group,
      items: info.items
        .sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label))
        .map(({ sort_order, ...rest }) => rest),
    }));

  return { moto, images: images ?? [], specs };
}
