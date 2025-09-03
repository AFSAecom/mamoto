import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import MotoCardView from '@/components/MotoCard';
import { getPublishedMotos } from '@/lib/public/motos';

interface PageProps {
  params: { brandSlug: string };
}

export function generateMetadata(): Metadata {
  return { title: 'Marque' };
}

export default async function BrandPage({ params }: PageProps) {
  const motos = await getPublishedMotos();
  const brand = params.brandSlug.toLowerCase();
  const filtered = motos.filter((m) => (m.brand || '').toLowerCase() === brand);
  if (filtered.length === 0) return notFound();

  const cards = filtered.map((m) => ({
    id: m.id,
    brand_name: m.brand ?? '',
    model_name: m.model ?? '',
    year: m.year,
    price_tnd: m.price ?? null,
  }));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-semibold mb-4">{filtered[0].brand}</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((m) => (
          <MotoCardView key={m.id} moto={m} />
        ))}
      </div>
    </main>
  );
}
