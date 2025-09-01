'use client'

import { useEffect, useState } from 'react'
import type { FacetGroup } from '@/types/filters'

export function useMotoFacets() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const [facets, setFacets] = useState<FacetGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!url || !anon) return
    const controller = new AbortController()
    async function run() {
      try {
        setLoading(true)
        const res = await fetch(`${url}/rest/v1/rpc/fn_get_filter_facets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: anon!,
            Authorization: `Bearer ${anon!}`,
          },
          body: JSON.stringify({}),
          signal: controller.signal,
        })
        const data: FacetGroup[] = await res.json().catch(() => [])
        if (res.status === 401 || res.status === 403) {
          setFacets([])
          setError(String(res.status))
          return
        }
        data.sort(
          (a, b) =>
            (a.group_sort ?? Infinity) - (b.group_sort ?? Infinity) ||
            a.group.localeCompare(b.group)
        )
        data.forEach(g =>
          g.items.sort(
            (a, b) =>
              (a.item_sort ?? Infinity) - (b.item_sort ?? Infinity) ||
              (a.label ?? a.key).localeCompare(b.label ?? b.key)
          )
        )
        setFacets(data)
        setError(null)
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message ?? String(err))
        }
      } finally {
        setLoading(false)
      }
    }
    run()
    return () => controller.abort()
  }, [url, anon])

  return { facets, loading, error }
}

export default useMotoFacets
