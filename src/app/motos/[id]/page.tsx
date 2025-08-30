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
  year?: number | null;
  price_tnd?: number | null;
  main_image_url?: string | null;
  status?: string | null;
  warranty?: string | null;
  dealer_name?: string | null;
};

type MotoSpec = {
  id: string;
  moto_id: string;
  group_name: string | null;
  label: string;
  value: string;
  sort_index?: number | null;
};

type MotoImage = {
  id: string;
  moto_id: string;
  url: string;
  alt: string | null;
  sort_index: number | null;
};

function stripLeadingLabel(label: string, value: string) {
  const l = label.trim().toLowerCase();
  const v = value.trim();
  if (v.toLowerCase().startsWith(l)) {
    const rest = v.slice(label.length).trim().replace(/^[:\-]/, '').trim();
    return rest || value;
  }
  return value;
}

function moneyTND(n?: number | null) {
  if (n == null) return '';
  try {
    return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${n} TND`;
  }
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

  // IMPORTANT: NE PAS importer de données locales. Lecture 100% Supabase.
  const { data: moto, error: eMoto } = await supabase
    .from('motos')
    .select('id, brand, model, year, price_tnd, main_image_url, status, warranty, dealer_name')
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

  const [{ data: specs }, { data: images }] = await Promise.all([
    supabase
      .from('moto_specs')
      .select('id, moto_id, group_name, label, value, sort_index')
      .eq('moto_id', id)
      .order('group_name', { ascending: true })
      .order('sort_index', { ascending: true }),
    supabase
      .from('moto_images')
      .select('id, moto_id, url, alt, sort_index')
      .eq('moto_id', id)
      .order('sort_index', { ascending: true }),
  ]);

  // Dé-doublonnage UI (sécurité supplémentaire)
  const uniqueSpecs: MotoSpec[] = [];
  const seen = new Set<string>();
  (specs ?? []).forEach(s => {
    const group = (s.group_name ?? 'Spécifications').trim();
    const cleanVal = stripLeadingLabel(s.label, s.value);
    const key = `${s.moto_id}|${group}|${s.label.trim()}|${cleanVal}|${s.sort_index ?? ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueSpecs.push({ ...s, group_name: group, value: cleanVal });
    }
  });

  // Regrouper par groupe
  const groups = new Map<string, MotoSpec[]>();
  uniqueSpecs.forEach(s => {
    if (!groups.has(s.group_name!)) groups.set(s.group_name!, []);
    groups.get(s.group_name!)!.push(s);
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{moto.brand} {moto.model}</h1>
        <p className="text-sm text-muted-foreground">
          {moto.year ? `Année ${moto.year} · ` : ''}{moto.price_tnd ? moneyTND(Number(moto.price_tnd)) : ''}
        </p>
        {(moto.status || moto.warranty || moto.dealer_name) && (
          <div className="mt-2 text-sm text-muted-foreground">
            {moto.status && <span className="mr-3">Statut: {moto.status}</span>}
            {moto.warranty && <span className="mr-3">Garantie: {moto.warranty}</span>}
            {moto.dealer_name && <span className="mr-3">Distributeur: {moto.dealer_name}</span>}
          </div>
        )}
      </div>

      {moto.main_image_url && (
        <div className="relative w-full max-w-3xl aspect-video bg-gray-100 rounded-xl overflow-hidden mb-6">
          {/* @ts-expect-error Next/Image config */}
          <Image src={moto.main_image_url} alt={`${moto.brand} ${moto.model}`} fill className="object-contain" />
        </div>
      )}

      {(images?.length ?? 0) > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {images!.map(im => (
            <div key={im.id} className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {/* @ts-expect-error Next/Image config */}
              <Image src={im.url} alt={im.alt ?? `${moto.brand} ${moto.model}`} fill className="object-cover" />
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
