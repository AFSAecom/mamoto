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

function encodeFilters(filters: Filters) {
  try {
    const json = JSON.stringify(filters)
    const base64 =
      typeof window === 'undefined'
        ? Buffer.from(json).toString('base64')
        : window.btoa(json)
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  } catch {
    return ''
  }
}

function decodeFilters(value: string): Filters {
  try {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
    const pad = base64.length % 4 ? base64 + '='.repeat(4 - (base64.length % 4)) : base64
    const json =
      typeof window === 'undefined'
        ? Buffer.from(pad, 'base64').toString()
        : window.atob(pad)
    return JSON.parse(json)
  } catch {
    return {}
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
      const parsed = decodeFilters(f)
      setFilters({ specs: {}, ...parsed })
    }
    const p = params.get('p')
    if (p) setPage(parseInt(p, 10) || 0)
  }, [])

  // update URL when filters or page change
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (filters && Object.keys(filters).length > 0) {
      params.set('f', encodeFilters(filters))
    } else {
      params.delete('f')
    }
    if (page > 0) {
      params.set('p', String(page))
    } else {
      params.delete('p')
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
          onChange={fn => {
            setFilters(prev => fn(prev))
            setPage(0)
          }}
        />
      </aside>
      <div className="flex-1">
        <div className="mb-4 flex items-center justify-between">
          <div className="font-semibold">{motos.length} résultats</div>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {motos.map(m => (
            <MotoCard key={m.id} moto={m} />
          ))}
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
