import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
}

export type MotoCard = {
  id: string; brand: string|null; model: string|null; year: number|null; price: number|null;
  slug: string|null; display_image: string|null;
};

export async function getPublishedMotos(): Promise<MotoCard[]> {
  const s = supabaseServer();

  // 1) Vue publique optimisée si dispo
  const { data: view } = await s
    .from('motos_public')
    .select('id,brand,model,year,price,slug,display_image')
    .order('id', { ascending: false });

  if (view?.length) {
    return view.map(v => ({
      ...v,
      display_image: v.display_image?.startsWith('http') ? v.display_image : null,
    }));
  }

  // 2) Fallback : jointure manuelle (si la vue n’existe pas)
  const { data: motos } = await s
    .from('motos')
    .select('id,brand,model,year,price,slug,main_image_url')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (!motos?.length) return [];

  const ids = motos.map(m => m.id);
  const { data: imgs } = await s
    .from('moto_images')
    .select('moto_id,image_url,is_main,created_at')
    .in('moto_id', ids)
    .order('is_main', { ascending: false })
    .order('created_at', { ascending: false });

  const pick = new Map<string, string>();
  imgs?.forEach(im => {
    if (!pick.has(im.moto_id)) pick.set(im.moto_id, im.image_url);
  });

  return motos.map(m => {
    const url = m.main_image_url || pick.get(m.id) || null;
    return {
      id: m.id,
      brand: m.brand,
      model: m.model,
      year: m.year,
      price: m.price,
      slug: m.slug ?? null,
      display_image: url && url.startsWith('http') ? url : null,
    };
  });
}

export type MotoSpec = {
  id: string; category: string|null; subcategory: string|null;
  key_name: string; value_text: string; unit: string|null; sort_order: number|null;
};

export async function getMotoFullByIdentifier(identifier: string) {
  const s = supabaseServer();
  const isUuid = /^[0-9a-f-]{36}$/i.test(identifier);
  const baseSel = 'id,brand,model,year,price,slug,main_image_url,is_published';

  const { data: moto } = isUuid
    ? await s.from('motos').select(baseSel).eq('id', identifier).single()
    : await s.from('motos').select(baseSel).eq('slug', identifier).single();

  if (!moto || moto.is_published !== true) return null;

  const { data: images } = await s
    .from('moto_images')
    .select('id,image_url,alt,is_main,created_at')
    .eq('moto_id', moto.id)
    .order('is_main', { ascending: false })
    .order('created_at', { ascending: false });

  const { data: specsRaw } = await s
    .from('moto_specs')
    .select('id,category,subcategory,key_name,value_text,unit,sort_order')
    .eq('moto_id', moto.id)
    .order('sort_order', { ascending: true })
    .order('key_name', { ascending: true });

  // Nettoyer et dédoublonner les caractéristiques
  const seen = new Set<string>();
  const specs = (specsRaw ?? [])
    .map(sp => ({
      ...sp,
      category: sp.category?.trim() || null,
      subcategory: sp.subcategory?.trim() || null,
      key_name: sp.key_name.trim(),
      value_text: (sp.value_text ?? '').trim(),
    }))
    .filter(sp => {
      if (!sp.value_text) return false;
      const key = `${sp.category || ''}|${sp.subcategory || ''}|${sp.key_name}|${sp.value_text}|${sp.unit || ''}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  const motoSanitized = {
    ...moto,
    main_image_url:
      moto.main_image_url && moto.main_image_url.startsWith('http')
        ? moto.main_image_url
        : null,
  };

  const imagesClean = (images ?? []).filter(im =>
    im.image_url?.startsWith('http'),
  );

  return { moto: motoSanitized, images: imagesClean, specs };
}

