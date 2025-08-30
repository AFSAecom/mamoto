import type { Metadata } from 'next';
import CompareClient from './CompareClient';
import { getPublishedMotos } from '@/lib/public/motos';

export const metadata: Metadata = {
  title: 'Comparateur',
  description: 'Comparez plusieurs modèles de motos',
};

export default async function ComparateurPage() {
  const motos = await getPublishedMotos();
  return <CompareClient motos={motos} />;
}

