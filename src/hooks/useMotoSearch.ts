'use client'

import { useEffect, useState } from 'react'

export type Range = { min?: number; max?: number }
export type Filters = {
  price?: Range
  year?: Range
  brand_ids?: string[]
  specs?: Record<string, boolean | string | string[] | Range | { in: string[] }>
}

export function cleanFilters(input: Filters): Filters {
  const output: Filters = {}
  if (input.price && (input.price.min !== undefined || input.price.max !== undefined)) {
    output.price = { ...input.price }
  }
  if (input.year && (input.year.min !== undefined || input.year.max !== undefined)) {
    output.year = { ...input.year }
  }
  if (input.brand_ids && input.brand_ids.length > 0) {
    output.brand_ids = [...input.brand_ids]
  }
  if (input.specs) {
    const specs: Filters['specs'] = {}
    for (const [key, value] of Object.entries(input.specs)) {
      if (value === undefined || value === null) continue
      if (typeof value === 'string') {
        if (value !== '') specs[key] = value
      } else if (typeof value === 'boolean') {
        specs[key] = value
      } else if (Array.isArray(value)) {
        if (value.length > 0) specs[key] = value
      } else if ('in' in value) {
        if (Array.isArray(value.in) && value.in.length > 0) specs[key] = { in: [...value.in] }
      } else {
        const range = value as Range
        if (range.min !== undefined || range.max !== undefined) {
          specs[key] = { ...range }
        }
      }
    }
    if (specs && Object.keys(specs).length > 0) {
      output.specs = specs
    }
  }
  return output
}

export function useMotoSearch(filters: Filters, page: number) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const [motos, setMotos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRequest, setLastRequest] = useState<any>(null)
  const [lastResponse, setLastResponse] = useState<any>(null)

  useEffect(() => {
    if (!url || !anon) return
    const controller = new AbortController()
    async function run() {
      const body = {
        p_filters: cleanFilters(filters),
        p_limit: 24,
        p_offset: page * 24,
      }
      try {
        console.debug('[filters->RPC]', body.p_filters)
        setLoading(true)
        setLastRequest(body)
        const res = await fetch(`${url}/rest/v1/rpc/fn_search_motos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: anon,
            Authorization: `Bearer ${anon}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        })
        const rows = await res.json().catch(() => [])
        setLastResponse(rows)
        console.debug('[RPC->rows]', rows)
        let list: any[] = []
        if (Array.isArray(rows)) {
          if (rows.every(r => r && typeof r === 'object' && 'j' in r)) {
            list = rows.map((r: any) => r.j)
          } else if (rows.every(r => typeof r === 'object')) {
            list = rows as any[]
          }
        } else if (rows && typeof rows === 'object') {
          list = [rows]
        }
        setMotos(list)
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
  }, [filters, page, url, anon])

  return { motos, loading, error, lastRequest, lastResponse }
}

export default useMotoSearch
