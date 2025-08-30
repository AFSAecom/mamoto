import type { Metadata } from 'next';
import Image from 'next/image';
import { supabaseServer } from '@/lib/supabase/server';

export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const dynamicParams = true;

type Params = { params: { id: string } };

type Moto = {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  price: number | null;             // "price" NUMERIC
  main_image_url: string | null;    // image principale possible
  is_published: boolean | null;
  slug: string | null;
};

type MotoSpecRow = {
  id: string;
  moto_id: string;
  category: string | null;
  subcategory: string | null;
  key_name: string | null;     // -> label
  value_text: string | null;   // -> value
  unit: string | null;
  sort_order: number | null;   // tri
};

type MotoImage = {
  id: string;
  moto_id: string;
  image_url: string | null;
  alt: string | null;
  is_main: boolean | null;
  created_at: string | null;
};

function moneyTND(n?: number | null) {
  if (n == null) return '';
  try {
    return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', maximumFractionDigits: 0 }).format(n);
  } catch { return `${n} TND`; }
}

function stripLeadingLabel(label?: string | null, value?: string | null) {
  const l = (label ?? '').trim().toLowerCase();
  const v = (value ?? '').trim();
  if (!l || !v) return v;
  if (v.toLowerCase().startsWith(l)) {
    const rest = v.slice(label!.length).trim().replace(/^[:\-]/, '').trim();
    return rest || v;
  }
  return v;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const supabase = supabaseServer();
  const { data } = await supabase
    .from('motos')
    .select('brand, model, year')
    .eq('id', params.id)
    .maybeSingle();

  const title = data ? `${data.brand} ${data.model} | moto.tn` : 'Fiche moto | moto.tn';
  return { title };
}

export default async function MotoPage({ params }: Params) {
  const id = params.id;
  const supabase = supabaseServer();

  // 1) Fiche principale
  const { data: moto, error: eMoto } = await supabase
    .from('motos')
    .select('id, brand, model, year, price, main_image_url, is_published, slug')
    .eq('id', id)
    .maybeSingle();

  if (eMoto) console.error('Erreur moto:', eMoto);
  if (!moto) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold">Fiche introuvable</h1>
        <p className="mt-2 text-muted-foreground">La moto demandée n’existe pas ou a été supprimée.</p>
      </div>
    );
  }

  // 2) Specs + Images
  const [{ data: specs }, { data: images }] = await Promise.all([
    supabase
      .from('moto_specs')
      .select('id, moto_id, category, subcategory, key_name, value_text, unit, sort_order')
      .eq('moto_id', id)
      .order('subcategory', { ascending: true, nullsFirst: true })
      .order('category', { ascending: true, nullsFirst: true })
      .order('sort_order', { ascending: true, nullsFirst: true }),
    supabase
      .from('moto_images')
      .select('id, moto_id, image_url, alt, is_main, created_at')
      .eq('moto_id', id)
      .order('is_main', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: true, nullsFirst: true }),
  ]);

  // Détermination de l'image principale
  const mainImage =
    moto.main_image_url ||
    (images?.find(im => im.is_main && im.image_url)?.image_url ?? images?.[0]?.image_url ?? null);

  // Regrouper specs par groupe = subcategory > category > "Spécifications"
  type UIItem = { id: string; label: string; value: string };
  const groups = new Map<string, UIItem[]>();
  (specs ?? []).forEach(s => {
    const group = (s.subcategory || s.category || 'Spécifications').trim();
    const label = (s.key_name ?? '').trim();
    let value = stripLeadingLabel(s.key_name, s.value_text);
    if (s.unit && value) value = `${value} ${s.unit}`.trim();
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push({ id: s.id, label, value: value ?? '' });
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{moto.brand} {moto.model}</h1>
        <p className="text-sm text-muted-foreground">
          {moto.year ? `Année ${moto.year} · ` : ''}{moto.price ? moneyTND(Number(moto.price)) : ''}
        </p>
      </div>

      {mainImage && (
        <div className="relative w-full max-w-3xl aspect-video bg-gray-100 rounded-xl overflow-hidden mb-6">
          {/* @ts-expect-error Next/Image runtime config */}
          <Image src={mainImage} alt={`${moto.brand} ${moto.model}`} fill className="object-contain" />
        </div>
      )}

      {(images?.length ?? 0) > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {images!.map(im => (
            <div key={im.id} className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {/* @ts-expect-error Next/Image runtime config */}
              <Image src={im.image_url ?? ''} alt={im.alt ?? `${moto.brand} ${moto.model}`} fill className="object-cover" />
            </div>
          ))}
        </div>
      )}

      {[...groups.entries()].map(([group, items]) => (
        <div key={group} className="mb-6">
          <h2 className="text-xl font-semibold mb-3">{group}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map(it => (
              <div key={it.id} className="rounded-lg border p-3">
                <div className="text-sm font-medium">{it.label}</div>
                <div className="text-sm text-muted-foreground">{it.value}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

