import rawMotos from '../../data/generated/motos.json';
import type { Moto } from './types';

// Map raw catalogue to Moto type used across the app
export const motos: Moto[] = (rawMotos as any[]).map((m) => {
  const specs: Record<string, any> = { ...(m.specs || {}) };
  if (m.price != null) specs.price_tnd = m.price;
  return {
    id: m.id,
    brand: m.brand,
    brand_slug: m.brandSlug,
    model: m.model,
    model_slug: m.modelSlug,
    year: m.year ?? undefined,
    image: m.imageUrl ?? undefined,
    listing: (m.listing as 'neuve' | 'occasion') ?? 'neuve', // TODO: vérifier la valeur dans la source officielle
    specs,
  } as Moto;
});

// TODO: compléter le catalogue si des modèles sont manquants dans la source officielle.
