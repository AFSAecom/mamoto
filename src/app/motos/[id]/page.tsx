// src/app/motos/[id]/page.tsx
import React from \"react\";
import { createClient } from \"@supabase/supabase-js\";
import { slugify } from \"../_slug\";
import DetailGallery from \"@/components/motos/DetailGallery\";

export const dynamic = \"force-dynamic\";
export const revalidate = 0;

type Group = { id: string; name: string; sort_order: number };
type Item = { id: string; group_id: string; label: string; unit: string | null; data_type: string; sort_order: number };
type ValueRow = { spec_item_id: string; value_number: number | null; value_text: string | null; value_boolean: boolean | null };

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error(\"Supabase env manquants\");
  return createClient(url, key, { auth: { persistSession: false } });
}

const IMG_EXT = /\.(png|jpe?g|webp|gif|bmp|svg)$/i;

async function listImagesForDetail(
  supabase: any,
  brandName: string | null | undefined,
  modelName: string | null | undefined
): Promise<string[]> {
  const bucket = process.env.NEXT_PUBLIC_STORAGE_BUCKET || \"motos\";
  const folder = `${slugify(String(brandName || \""))}-${slugify(String(modelName || \""))}`;
  if (!folder.replace(/-/g, \"")) return [];
  const { data } = await supabase.storage
    .from(bucket)
    .list(folder, { limit: 100, sortBy: { column: \"name\", order: \"asc\" } });
  const files = (data || []).filter((f: any) => IMG_EXT.test(f.name));
  return files.map((f: any) => supabase.storage.from(bucket).getPublicUrl(`${folder}/${f.name}`).data.publicUrl);
}

const fmtInt = (v: number) => new Intl.NumberFormat(\"fr-FR\", { maximumFractionDigits: 0 }).format(v);

export default async function MotoDetail({ params }: { params: { id: string } }) {
  const supabase = getSupabase();

  const { data: moto } = await supabase
    .from(\"motos\")
    .select(\"*, brands(name)\")
    .eq(\"id\", params.id)
    .single();

  if (!moto) {
    return <div className=\"max-w-4xl mx-auto px-4 py-10\">Moto introuvable.</div>;
  }

  let gallery = await listImagesForDetail(supabase, (moto as any).brands?.name ?? (moto as any).brand_name, (moto as any).model_name ?? (moto as any).model);
  if (!gallery || gallery.length === 0) {
    gallery = [];
  }

  const { data: groups } = await supabase
    .from(\"spec_groups\")
    .select(\"id, name, sort_order\")
    .order(\"sort_order\", { ascending: true });
  const { data: items } = await supabase
    .from(\"spec_items\")
    .select(\"id, group_id, label, unit, data_type, sort_order\")
    .order(\"sort_order\", { ascending: true });
  const { data: rows } = await supabase
    .from(\"moto_spec_values\")
    .select(\"spec_item_id, value_number, value_text, value_boolean\")
    .eq(\"moto_id\", params.id);

  const valMap = new Map<string, ValueRow[]>();
  (rows || []).forEach((r: any) => {
    if (!valMap.has(r.spec_item_id)) valMap.set(r.spec_item_id, []);
    valMap.get(r.spec_item_id)!.push(r);
  });

  function renderValue(it: Item): string | null {
    const vs = valMap.get(it.id) || [];
    if (vs.length === 0) return null;
    const first = vs[0];
    if (it.data_type === \"number\") {
      const n = first.value_number;
      if (n == null) return null;
      return it.unit ? `${fmtInt(n)} ${it.unit}` : fmtInt(n);
    } else if (it.data_type === \"boolean\") {
      if (first.value_boolean === null || first.value_boolean === undefined) return null;
      return first.value_boolean ? \"Oui\" : \"Non\";
    } else {
      const vals = vs.map((x) => x.value_text).filter((s) => !!s) as string[];
      if (vals.length === 0) return null;
      return vals.join(\", \");
    }
  }

  const groupsWithData = (groups || []).map((g: Group) => {
    const its = (items || []).filter((it: Item) => it.group_id === g.id);
    const rows = its.map((it) => ({ it, val: renderValue(it) })).filter((x) => x.val !== null);
    return { group: g, rows };
  }).filter((g) => g.rows.length > 0);

  return (
    <div className=\"max-w-5xl mx-auto px-4 py-6 space-y-6\">
      <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
        <DetailGallery urls={gallery} />

        <div className=\"space-y-2\">
          <h1 className=\"text-2xl font-bold\">{(moto as any).brands?.name ?? \"—\"} {(moto as any).model_name ?? \"\\"}</h1>
          <p className=\"opacity-80\">{(moto as any).year ?? \"—\"} · {(moto as any).price_tnd != null ? `${(moto as any).price_tnd} TND` : \"—\"}</p>
        </div>
      </div>

      <section className=\"space-y-4\">
        <h2 className=\"text-xl font-semibold\">Fiche technique</h2>
        <div className=\"space-y-4\">
          {groupsWithData.map(({ group, rows }) => (
            <div key={group.id} className=\"rounded-lg border border-white/10\">
              <div className=\"px-4 py-2 font-semibold\">{group.name}</div>
              <div className=\"px-4 pb-3\">
                <dl className=\"grid grid-cols-1 sm:grid-cols-2 gap-x-6\">
                  {rows.map(({ it, val }) => (
                    <div key={it.id} className=\"py-2 border-b border-white/5 sm:border-b-0\">
                      <dt className=\"text-sm opacity-75\">{it.label}</dt>
                      <dd className=\"text-sm\">{val}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
