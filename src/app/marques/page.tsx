import type { Metadata } from 'next';
import { getAllMotos } from '../../lib/motos';
import BrandsClient from './BrandsClient';

export const metadata: Metadata = {
  title: 'Marques',
  description: 'Liste des marques de motos',
};

interface BrandInfo {
  name: string;
  slug: string;
  count: number;
}

export default function MarquesPage() {
  const allMotos = getAllMotos();
  const map = new Map<string, BrandInfo>();

  allMotos.forEach((m) => {
    if (!map.has(m.brandSlug)) {
      map.set(m.brandSlug, { name: m.brand, slug: m.brandSlug, count: 0 });
    }
    map.get(m.brandSlug)!.count += 1;
  });

  const brands = Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return <BrandsClient brands={brands} />;
}

