import type { Metadata } from 'next';
import BrandsClient from './BrandsClient';
import { getPublishedMotos } from '@/lib/public/motos';

export const metadata: Metadata = {
  title: 'Marques',
  description: 'Liste des marques de motos',
};

interface BrandInfo {
  name: string;
  slug: string;
  count: number;
}

export default async function MarquesPage() {
  const motos = await getPublishedMotos();
  const brandMap: Record<string, number> = {};
  motos.forEach((m) => {
    const b = m.brand_name || 'Autres';
    brandMap[b] = (brandMap[b] || 0) + 1;
  });
  const brands: BrandInfo[] = Object.entries(brandMap)
    .map(([name, count]) => ({ name, slug: name.toLowerCase(), count }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return <BrandsClient brands={brands} />;
}

