import type { Metadata } from 'next';
import BrandsClient from './BrandsClient';
import { loadMotos } from '@/lib/motos';

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
  await loadMotos();
  const brands: BrandInfo[] = [];
  return <BrandsClient brands={brands} />;
}

