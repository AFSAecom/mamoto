import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadMotos } from '../../../lib/motos';

interface PageProps {
  params: { brandSlug: string };
}

export function generateMetadata(): Metadata {
  return { title: 'Marque' };
}

export default async function BrandPage({ params }: PageProps) {
  await loadMotos();
  notFound();
}
