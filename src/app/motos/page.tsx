'use client'

import { useEffect, useState } from 'react'
import MotoCard from '@/components/MotoCard'
import FiltersPanel from '@/components/FiltersPanel'
import { useMotoFacets } from '@/hooks/useMotoFacets'
import {
  useMotoSearch,
  Filters,
  Range,
  cleanFilters,
} from '@/hooks/useMotoSearch'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationLink,
} from '@/components/ui/pagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { encode, decode } from '@/utils/base64url'

export default function MotosPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const init = (() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const f = params.get('f')
      if (f) {
        const decoded = decode<{ filters: Filters; page: number }>(f)
        return {
          filters: decoded.filters || {},
          page: typeof decoded.page === 'number' ? decoded.page : 0,
        }
      }
    }
    return { filters: {}, page: 0 }
  })()
  const [filters, setFilters] = useState<Filters>(init.filters)
  const [page, setPage] = useState(init.page)
  const { facets, error: facetsError } = useMotoFacets()
  const { motos, loading, error, lastRequest, lastResponse } = useMotoSearch(
    filters,
    page
  )
  const [diagOpen, setDiagOpen] = useState(false)
  const blocked =
    (error && (error.includes('HTTP 401') || error.includes('HTTP 403'))) ||
    (facetsError &&
      (facetsError.includes('HTTP 401') || facetsError.includes('HTTP 403')))

  // update URL when filters or page change
  useEffect(() => {
    const encoded = encode({ filters, page })
    const url = `${window.location.pathname}?f=${encoded}`
    window.history.replaceState(null, '', url)
  }, [filters, page])

  const handleFilterChange = (next: Filters) => {
    const parseRange = (r?: Range): Range | undefined =>
      r
        ? {
            min: r.min != null ? parseFloat(String(r.min)) : undefined,
            max: r.max != null ? parseFloat(String(r.max)) : undefined,
          }
        : undefined
    const normalized: Filters = { ...next }
    if (normalized.price) normalized.price = parseRange(normalized.price)
    if (normalized.year) normalized.year = parseRange(normalized.year)
    if (normalized.specs) {
      const s: NonNullable<Filters['specs']> = {}
      for (const [k, v] of Object.entries(normalized.specs)) {
        if (v && typeof v === 'object' && !Array.isArray(v) && !('in' in v)) {
          s[k] = parseRange(v as Range) as any
        } else {
          s[k] = v as any
        }
      }
      normalized.specs = s
    }
    setFilters(normalized)
    setPage(0)
  }

  function findItem(key: string) {
    for (const g of facets) {
      const it = (g.items as any[]).find((i: any) => i.key === key)
      if (it) return it
    }
    return undefined
  }

  const badges: {
    key: string
    label: string
    value: string
    remove: () => void
  }[] = []
  const cleaned = cleanFilters(filters)
  if (cleaned.price) {
    const item = findItem('price')
    badges.push({
      key: 'price',
      label: item?.label || 'price',
      value: `${cleaned.price.min ?? ''}-${cleaned.price.max ?? ''}`,
      remove: () => setFilters(f => ({ ...f, price: undefined })),
    })
  }
  if (cleaned.year) {
    const item = findItem('year')
    badges.push({
      key: 'year',
      label: item?.label || 'year',
      value: `${cleaned.year.min ?? ''}-${cleaned.year.max ?? ''}`,
      remove: () => setFilters(f => ({ ...f, year: undefined })),
    })
  }
  if (cleaned.brand_ids) {
    const item = findItem('brand_ids')
    cleaned.brand_ids.forEach(id => {
      badges.push({
        key: `brand_ids:${id}`,
        label: item?.label || 'brand_ids',
        value: id,
        remove: () =>
          setFilters(f => ({
            ...f,
            brand_ids: f.brand_ids?.filter(b => b !== id),
          })),
      })
    })
  }
  if (cleaned.specs) {
    for (const [k, v] of Object.entries(cleaned.specs)) {
      const item = findItem(k)
      if (typeof v === 'boolean') {
        badges.push({
          key: k,
          label: item?.label || k,
          value: v ? 'Oui' : 'Non',
          remove: () =>
            setFilters(f => {
              const n = { ...f }
              if (n.specs) {
                delete n.specs[k]
                if (Object.keys(n.specs).length === 0) delete n.specs
              }
              return n
            }),
        })
      } else if (Array.isArray(v)) {
        v.forEach(val =>
          badges.push({
            key: `${k}:${val}`,
            label: item?.label || k,
            value: val,
            remove: () =>
              setFilters(f => {
                const n = { ...f }
                const arr = (n.specs?.[k] as string[]).filter(v2 => v2 !== val)
                if (arr.length > 0) {
                  n.specs = { ...n.specs, [k]: arr }
                } else if (n.specs) {
                  delete n.specs[k]
                  if (Object.keys(n.specs).length === 0) delete n.specs
                }
                return n
              }),
          })
        )
      } else if (typeof v === 'object' && v) {
        if ('in' in v) {
          v.in.forEach(val =>
            badges.push({
              key: `${k}:${val}`,
              label: item?.label || k,
              value: val,
              remove: () =>
                setFilters(f => {
                  const n = { ...f }
                  const arr = (n.specs?.[k] as any).in.filter(
                    (x: string) => x !== val
                  )
                  if (arr.length > 0) {
                    n.specs = { ...n.specs, [k]: { in: arr } }
                  } else if (n.specs) {
                    delete n.specs[k]
                    if (Object.keys(n.specs).length === 0) delete n.specs
                  }
                  return n
                }),
            })
          )
        } else {
          badges.push({
            key: k,
            label: item?.label || k,
            value: `${(v as Range).min ?? ''}-${(v as Range).max ?? ''}`,
            remove: () =>
              setFilters(f => {
                const n = { ...f }
                if (n.specs) {
                  delete n.specs[k]
                  if (Object.keys(n.specs).length === 0) delete n.specs
                }
                return n
              }),
          })
        }
      }
    }
  }

  return (
    <div className="p-4 space-y-4">
      {blocked && (
        <div className="bg-red-500 text-white p-2 text-center">
          Accès bloqué : vérifiez les policies RLS et GRANT EXECUTE sur fn_search_motos/fn_get_filter_facets.
        </div>
      )}
      {!supabaseUrl || !supabaseAnon ? (
        <div className="bg-red-500 text-white p-2 text-center">
          Config manquante : NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY — ajoutez-les à .env.local
        </div>
      ) : null}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Filtres</Button>
          </SheetTrigger>
          <SheetContent side="left" className="overflow-y-auto p-4">
            <FiltersPanel
              facets={facets}
              filters={filters}
              onChange={handleFilterChange}
            />
          </SheetContent>
        </Sheet>
      </div>
      <div className="flex gap-6">
        <aside className="w-64 hidden md:block">
          <FiltersPanel
            facets={facets}
            filters={filters}
            onChange={handleFilterChange}
          />
        </aside>
        <div className="flex-1">
          <div className="mb-4 flex flex-wrap gap-2">
            {badges.map(b => (
              <Badge key={b.key} onClick={b.remove} className="cursor-pointer">
                {b.label}: {b.value}
              </Badge>
            ))}
          </div>
          {loading ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : motos.length === 0 ? (
            <div>Aucun résultat, élargissez les filtres</div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {motos.map(m => (
                <MotoCard key={m.id} moto={m} />
              ))}
            </div>
          )}
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
          <div className="mt-4">
            <Button variant="ghost" onClick={() => setDiagOpen(o => !o)}>
              Diagnostic
            </Button>
            {diagOpen && (
              <div className="mt-2 border p-4 space-y-2 text-sm">
                <div>lastRequest</div>
                <pre className="overflow-x-auto">
                  {JSON.stringify(lastRequest, null, 2)}
                </pre>
                <div>lastResponse</div>
                <pre className="overflow-x-auto">
                  {JSON.stringify(lastResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
