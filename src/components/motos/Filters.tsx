'use client';

import { startTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface Brand {
  id: string;
  name: string | null;
}

interface FiltersProps {
  brands: Brand[];
}

export default function Filters({ brands }: FiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === undefined || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const qs = params.toString();
    startTransition(() => {
      router.replace(`/motos${qs ? `?${qs}` : ''}`, { scroll: false });
    });
  };

  const brandId = searchParams.get('brandId') ?? 'all';
  const model = searchParams.get('model') ?? '';
  const yearMin = searchParams.get('yearMin') ?? '';
  const yearMax = searchParams.get('yearMax') ?? '';
  const priceMin = searchParams.get('priceMin') ?? '';
  const priceMax = searchParams.get('priceMax') ?? '';

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      <Select
        value={brandId}
        onValueChange={val => updateParam('brandId', val === 'all' ? undefined : val)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Toutes marques" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes marques</SelectItem>
          {brands.map(b => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        placeholder="Modèle"
        value={model}
        onChange={e => updateParam('model', e.target.value || undefined)}
      />
      <Input
        type="number"
        placeholder="Année min"
        value={yearMin}
        onChange={e => updateParam('yearMin', e.target.value || undefined)}
      />
      <Input
        type="number"
        placeholder="Année max"
        value={yearMax}
        onChange={e => updateParam('yearMax', e.target.value || undefined)}
      />
      <Input
        type="number"
        placeholder="Prix min"
        value={priceMin}
        onChange={e => updateParam('priceMin', e.target.value || undefined)}
      />
      <Input
        type="number"
        placeholder="Prix max"
        value={priceMax}
        onChange={e => updateParam('priceMax', e.target.value || undefined)}
      />
    </div>
  );
}

