'use client'

import { useEffect, useState } from 'react'
import type { Filters } from '@/types/filters'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export interface MotoSearchResult {
  id: string
  brand: string
  model: string
  year?: number | null
  price?: number | null
  display_image?: string | null
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debounced
}

export function useMotoSearch(filters: Filters, page: number) {
  const [motos, setMotos] = useState<MotoSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const debouncedFilters = useDebouncedValue(filters, 300)
  const debouncedPage = useDebouncedValue(page, 300)

  useEffect(() => {
    const controller = new AbortController()

    async function run() {
      try {
        setLoading(true)
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/fn_search_motos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
          body: JSON.stringify({
            p_filters: debouncedFilters,
            p_limit: 24,
            p_offset: debouncedPage * 24,
          }),
          signal: controller.signal,
        })
        if (!res.ok) {
          throw new Error(`Search failed: ${res.status}`)
        }
        const data: MotoSearchResult[] = await res.json()
        setMotos(data)
        setError(null)
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err as Error)
        }
      } finally {
        setLoading(false)
      }
    }

    run()

    return () => {
      controller.abort()
    }
  }, [debouncedFilters, debouncedPage])

  return { motos, loading, error }
}

export default useMotoSearch
