'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

interface Brand {
  id: string
  name: string
}

interface FiltersProps {
  brands?: Brand[]
}

export default function Filters({ brands: initialBrands = [] }: FiltersProps) {
  const [brands, setBrands] = useState<Brand[]>(initialBrands)
  const searchParams = useSearchParams()
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [q, setQ] = useState(searchParams.get('q') || '')

  // load brands client-side if not provided
  useEffect(() => {
    if (brands.length === 0) {
      supabase
        .from('brands')
        .select('id,name')
        .order('name', { ascending: true })
        .then(({ data }) => {
          if (data) setBrands(data as Brand[])
        })
    }
  }, [brands.length])

  // keep q in sync with URL
  useEffect(() => {
    setQ(searchParams.get('q') || '')
  }, [searchParams])

  // debounce q
  useEffect(() => {
    const handle = setTimeout(() => {
      const qs = new URLSearchParams(searchParams)
      const val = q.trim()
      if (val) qs.set('q', val)
      else qs.delete('q')
      startTransition(() => {
        router.replace(`/motos?${qs.toString()}`, { scroll: false })
      })
    }, 250)
    return () => clearTimeout(handle)
  }, [q, router, searchParams, startTransition])

  const update = (key: string, value: string) => {
    const qs = new URLSearchParams(searchParams)
    if (value) qs.set(key, value)
    else qs.delete(key)
    startTransition(() => {
      router.replace(`/motos?${qs.toString()}`, { scroll: false })
    })
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div>
        <label className="block text-sm mb-1">Marque</label>
        <select
          className="w-full border rounded p-2"
          value={searchParams.get('brand_id') || ''}
          onChange={e => update('brand_id', e.target.value)}
        >
          <option value="">Toutes les marques</option>
          {brands.map(b => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm mb-1">Année min</label>
        <input
          type="number"
          placeholder="0"
          className="w-full border rounded p-2"
          value={searchParams.get('year_min') || ''}
          onChange={e => update('year_min', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm mb-1">Année max</label>
        <input
          type="number"
          placeholder="0"
          className="w-full border rounded p-2"
          value={searchParams.get('year_max') || ''}
          onChange={e => update('year_max', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm mb-1">Prix min</label>
        <input
          type="number"
          placeholder="0"
          className="w-full border rounded p-2"
          value={searchParams.get('price_min') || ''}
          onChange={e => update('price_min', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm mb-1">Prix max</label>
        <input
          type="number"
          placeholder="0"
          className="w-full border rounded p-2"
          value={searchParams.get('price_max') || ''}
          onChange={e => update('price_max', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm mb-1">Recherche</label>
        <input
          type="text"
          placeholder="Rechercher"
          className="w-full border rounded p-2"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>
    </div>
  )
}

