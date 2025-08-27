import type { Metadata } from 'next';
import BrandCard from '@/components/BrandCard';
import { Input } from '@/components/ui/input';
import { getAllMotos } from '@/lib/motos';
import React from 'react';

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

function BrandsClient({ brands }: { brands: BrandInfo[] }) {
  'use client';
  const [query, setQuery] = React.useState('');
  const filtered = React.useMemo(
    () =>
      brands.filter((b) =>
        b.name.toLowerCase().includes(query.toLowerCase())
      ),
    [brands, query]
  );

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-3xl font-bold">Marques</h1>
      <Input
        placeholder="Rechercher une marque"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Rechercher une marque"
      />
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {filtered.map((b) => (
          <BrandCard
            key={b.slug}
            name={b.name}
            count={b.count}
            href={`/marques/${b.slug}`}
          />
        ))}
      </div>
    </div>
  );
}
