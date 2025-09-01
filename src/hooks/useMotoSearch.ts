'use client'

import { useEffect, useState } from 'react'
import type { Filters } from '@/types/filters'

export type Range = { min?: number; max?: number }

function cleanFilters(input: Filters): Filters {
  const out: Filters = {}
  if (input.price && (input.price.min != null || input.price.max != null))
    out.price = input.price
  if (input.year && (input.year.min != null || input.year.max != null))
    out.year = input.year
  if (input.brand_ids && input.brand_ids.length) out.brand_ids = input.brand_ids
  if (input.specs) {
    const s: NonNullable<Filters['specs']> = {}
    for (const [k, v] of Object.entries(input.specs)) {
      if (v === undefined || v === null) continue
      if (typeof v === 'string' && v.trim() === '') continue
      if (Array.isArray(v) && v.length === 0) continue
      if (typeof v === 'object' && !Array.isArray(v)) {
        const hasAny =
          ('min' in v && (v as any).min != null) ||
          ('max' in v && (v as any).max != null) ||
          ('in' in v && Array.isArray((v as any).in) && (v as any).in.length > 0)
        if (!hasAny) continue
      }
      s[k] = v as any
    }
    if (Object.keys(s).length) out.specs = s
  }
  return out
}

export function useMotoSearch(filters: Filters, page: number) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setError(null)
      const cleaned = cleanFilters(filters)
      console.debug('[search] filters', cleaned)
      console.debug('[search] page', page)
      try {
        const body = {
          p_filters: cleaned,
          p_limit: 24,
          p_offset: Math.max(0, page) * 24,
        }
        const res = await fetch(`${url}/rest/v1/rpc/fn_search_motos`, {
          method: 'POST',
          headers: {
            apikey: anon,
            Authorization: `Bearer ${anon}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const t = await res.text()
          throw new Error(`fn_search_motos HTTP ${res.status}: ${t}`)
        }
        const rows = await res.json()
        const list = Array.isArray(rows)
          ? rows.map((r: any) => r.j ?? r)
          : []
        if (!cancelled) setData(list)
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Unknown error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [filters, page, url, anon])

  return { motos: data, loading, error }
}

export default useMotoSearch
