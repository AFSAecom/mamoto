import type { Metadata } from 'next';
import CompareClient from './CompareClient';
import { loadMotos } from '@/lib/motos';

export const metadata: Metadata = {
  title: 'Comparateur',
  description: 'Comparez plusieurs modèles de motos',
};

export default async function ComparateurPage() {
  const motos = await loadMotos();
  return <CompareClient motos={motos} />;
}

