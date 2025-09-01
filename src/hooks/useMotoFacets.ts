'use client'

import { useEffect, useState } from 'react'
import type { FacetGroup } from '@/types/filters'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function useMotoFacets() {
  const [facets, setFacets] = useState<FacetGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchFacets = async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/rpc/fn_get_filter_facets`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
            },
            body: JSON.stringify({}),
          }
        )
        if (!res.ok) {
          throw new Error(`Failed to load facets: ${res.status}`)
        }
        const data: FacetGroup[] = await res.json()
        // sort groups and items
        data.sort((a, b) => (a.group_sort ?? 0) - (b.group_sort ?? 0))
        data.forEach(g =>
          g.items.sort(
            (a, b) =>
              (a.item_sort ?? 0) - (b.item_sort ?? 0) ||
              (a.label?.localeCompare(b.label ?? '') ?? 0)
          )
        )
        setFacets(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchFacets()
  }, [])

  return { facets, loading, error }
}

export default useMotoFacets
