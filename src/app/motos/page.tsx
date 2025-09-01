'use client'

import { useEffect, useState } from 'react'
import MotoCard from '@/components/MotoCard'
import FiltersPanel from '@/components/FiltersPanel'
import { useMotoFacets } from '@/hooks/useMotoFacets'
import { useMotoSearch } from '@/hooks/useMotoSearch'
import type { Filters } from '@/types/filters'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationLink,
} from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'

function encodeState(state: { filters: Filters; page: number }) {
  try {
    const json = JSON.stringify(state)
    const base64 =
      typeof window === 'undefined'
        ? Buffer.from(json).toString('base64')
        : window.btoa(json)
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  } catch {
    return ''
  }
}

function decodeState(value: string): { filters: Filters; page: number } {
  try {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
    const pad =
      base64.length % 4 ? base64 + '='.repeat(4 - (base64.length % 4)) : base64
    const json =
      typeof window === 'undefined'
        ? Buffer.from(pad, 'base64').toString()
        : window.atob(pad)
    return JSON.parse(json)
  } catch {
    return { filters: {}, page: 0 }
  }
}

export default function MotosPage() {
  const { facets } = useMotoFacets()
  const [filters, setFilters] = useState<Filters>({ specs: {} })
  const [page, setPage] = useState(0)

  // hydrate from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const f = params.get('f')
    if (f) {
      const parsed = decodeState(f)
      setFilters({ specs: {}, ...(parsed.filters ?? {}) })
      if (parsed.page) setPage(parsed.page)
    }
  }, [])

  // update URL when filters or page change
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const encoded = encodeState({ filters, page })
    if (encoded) {
      params.set('f', encoded)
    } else {
      params.delete('f')
    }
    const url = `${window.location.pathname}?${params.toString()}`
    window.history.replaceState(null, '', url)
  }, [filters, page])

  const { motos, loading } = useMotoSearch(filters, page)

  return (
    <div className="flex gap-6 p-6">
      <aside className="w-64 hidden md:block">
        <FiltersPanel
          facets={facets}
          filters={filters}
          onChange={next => {
            setFilters(next)
            setPage(0)
          }}
        />
      </aside>
      <div className="flex-1">
        <div className="mb-4 flex items-center justify-between">
          <div className="font-semibold">{motos.length} résultats</div>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))
            : motos.map(m => <MotoCard key={m.id} moto={m} />)}
        </div>
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={e => {
                  e.preventDefault()
                  if (page > 0) setPage(page - 1)
                }}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                {page + 1}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={e => {
                  e.preventDefault()
                  setPage(page + 1)
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
