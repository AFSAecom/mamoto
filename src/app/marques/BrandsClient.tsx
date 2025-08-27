'use client';

import React from 'react';
import BrandCard from '@/components/BrandCard';
import { Input } from '@/components/ui/input';

interface BrandInfo {
  name: string;
  slug: string;
  count: number;
}

export default function BrandsClient({ brands }: { brands: BrandInfo[] }) {
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

