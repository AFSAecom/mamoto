import { supabase } from './supabaseClient';

export type MotoFull = {
  moto:
    | {
        id: string;
        brand_id: string;
        brand_name: string;
        model_name: string;
        year: number;
        price_tnd?: number | null;
      }
    | null;
  images: { id: string; image_url: string; alt: string | null }[];
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
  const { data: moto, error: motoError } = await supabase
    .from('motos')
    .select('id,brand_id,brand_name,model_name,year,price_tnd')
    .eq('id', motoId)
    .maybeSingle();

  if (motoError) throw motoError;
  if (!moto) return { moto: null, images: [], specs: [] };

  const { data: images, error: imagesError } = await supabase
    .from('moto_images')
    .select('id,image_url,alt,sort_order,is_main,created_at')
    .eq('moto_id', motoId)
    .order('is_main', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (imagesError) throw imagesError;

  const { data: groups, error: groupsError } = await supabase
    .from('spec_groups')
    .select('id,name,sort_order')
    .order('sort_order', { ascending: true });
  if (groupsError) throw groupsError;

  const { data: items, error: itemsError } = await supabase
    .from('spec_items')
    .select('id,key,label,group_id,unit,sort_order')
    .order('sort_order', { ascending: true });
  if (itemsError) throw itemsError;

  const { data: values, error: valuesError } = await supabase
    .from('moto_spec_values')
    .select(
      'spec_item_id,value_text,value_number,value_boolean,value_json,unit_override'
    )
    .eq('moto_id', motoId);
  if (valuesError) throw valuesError;

  const specs =
    groups?.map((g) => {
      const groupItems =
        items
          ?.filter((it) => it.group_id === g.id)
          .map((it) => {
            const val = values?.find((v) => v.spec_item_id === it.id);
            return {
              key: it.key,
              label: it.label,
              unit: val?.unit_override ?? it.unit ?? null,
              value_text: val?.value_text ?? null,
              value_number: val?.value_number ?? null,
              value_boolean: val?.value_boolean ?? null,
              value_json: val?.value_json ?? null,
            };
          }) ?? [];
      return { group: g.name, items: groupItems };
    })
      ?.filter((grp) => grp.items.length > 0) ?? [];

  return {
    moto,
    images: images?.map((im) => ({ id: im.id, image_url: im.image_url, alt: im.alt ?? null })) ?? [],
    specs,
  };
}
