import type { Metadata } from 'next';
import CompareClient from './CompareClient';

export const metadata: Metadata = {
  title: 'Comparateur',
  description: 'Comparez plusieurs modèles de motos',
};

export default function ComparateurPage() {
  return <CompareClient />;
}

