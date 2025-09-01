'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { startTransition } from 'react'

interface BrandOption {
  id: string
  name: string
}

interface FiltersProps {
  brands: BrandOption[]
}

export default function Filters({ brands }: FiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (key: string, value: string) => {
    const qs = new URLSearchParams(searchParams.toString())
    if (value) qs.set(key, value)
    else qs.delete(key)
    const query = qs.toString()
    startTransition(() => {
      router.replace(query ? `/motos?${query}` : '/motos', { scroll: false })
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <select
        value={searchParams.get('brand_id') ?? ''}
        onChange={e => handleChange('brand_id', e.target.value)}
        className="border p-2 rounded"
      >
        <option value="">Toutes marques</option>
        {brands.map(b => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="Année min"
          value={searchParams.get('year_min') ?? ''}
          onChange={e => handleChange('year_min', e.target.value)}
          className="border p-2 rounded w-full"
        />
        <input
          type="number"
          placeholder="Année max"
          value={searchParams.get('year_max') ?? ''}
          onChange={e => handleChange('year_max', e.target.value)}
          className="border p-2 rounded w-full"
        />
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          step="0.01"
          placeholder="Prix min"
          value={searchParams.get('price_min') ?? ''}
          onChange={e => handleChange('price_min', e.target.value)}
          className="border p-2 rounded w-full"
        />
        <input
          type="number"
          step="0.01"
          placeholder="Prix max"
          value={searchParams.get('price_max') ?? ''}
          onChange={e => handleChange('price_max', e.target.value)}
          className="border p-2 rounded w-full"
        />
      </div>
      <input
        type="text"
        placeholder="Recherche"
        value={searchParams.get('q') ?? ''}
        onChange={e => handleChange('q', e.target.value)}
        className="border p-2 rounded"
      />
    </div>
  )
}

