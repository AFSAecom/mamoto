import rawMotos from '../../data/generated/motos.json';
import type { Moto } from './types';

// Map raw catalogue to Moto type used across the app
export const motos: Moto[] = (rawMotos as any[]).map((m) => {
  const specs: Record<string, any> = { ...(m.specs || {}) };
  if (m.price != null) specs.price_tnd = m.price;
  return {
    id: m.id,
    brand: m.brand,
    model: m.model,
    year: m.year ?? undefined,
    image: m.imageUrl ?? undefined,
    specs,
  } as Moto;
});

// TODO: compléter le catalogue si des modèles sont manquants dans la source officielle.
