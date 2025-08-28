import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { findByBrand } from '../../../lib/motos';

interface PageProps {
  params: { brandSlug: string };
}

export function generateMetadata({ params }: PageProps): Metadata {
  const motos = findByBrand(params.brandSlug);
  if (motos.length === 0) return { title: 'Marque' };
  const brand = motos[0].brand;
  return {
    title: brand,
    description: `Modèles de la marque ${brand}`,
  };
}

export default function BrandPage({ params }: PageProps) {
  const motos = findByBrand(params.brandSlug);
  if (motos.length === 0) notFound();
  const brand = motos[0].brand;

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-3xl font-bold">{brand}</h1>
      <ul className="list-disc pl-5 space-y-1">
        {motos.map((m) => (
          <li key={m.id}>
            <Link href={`/modeles/${m.id}`}>{m.model} {m.year}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
