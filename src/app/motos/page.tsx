'use client'

import { useEffect, useState } from 'react'
import MotoCard from '@/components/MotoCard'
import FiltersPanel from '@/components/FiltersPanel'
import { useMotoFacets } from '@/hooks/useMotoFacets'
import { useMotoSearch, Filters, Range, cleanFilters } from '@/hooks/useMotoSearch'
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
  const [filters, setFilters] = useState<Filters>({})
  const [page, setPage] = useState(0)
  const { facets } = useMotoFacets()
  const { motos, loading, error, lastRequest, lastResponse } = useMotoSearch(
    filters,
    page
  )
  const [diagOpen, setDiagOpen] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  // hydrate from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const f = params.get('f')
    if (f) {
      const decoded = decode<{ filters: Filters; page: number }>(f)
      if (decoded.filters) setFilters(decoded.filters)
      if (typeof decoded.page === 'number') setPage(decoded.page)
    }
  }, [])

  // update URL when filters or page change
  useEffect(() => {
    const encoded = encode({ filters, page })
    const url = `${window.location.pathname}?f=${encoded}`
    window.history.replaceState(null, '', url)
  }, [filters, page])

  const handleFilterChange = (next: Filters) => {
    setFilters(next)
    setPage(0)
  }

  function findItem(key: string) {
    for (const g of facets) {
      const it = g.items.find(i => i.key === key)
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

  async function runTest() {
    if (!supabaseUrl || !supabaseAnon) return
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/fn_search_motos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnon,
        Authorization: `Bearer ${supabaseAnon}`,
      },
      body: JSON.stringify({ p_filters: {}, p_limit: 1, p_offset: 0 }),
    })
    const data = await res.json().catch(() => null)
    setTestResult(data)
  }

  return (
    <div className="p-4 space-y-4">
      {!supabaseUrl || !supabaseAnon ? (
        <div className="bg-red-500 text-white p-2 text-center">
          Config manquante : NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY — configurez .env.local
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
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : motos.length === 0 ? (
            <div>Aucun résultat</div>
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
                <div>Environnement</div>
                <pre className="overflow-x-auto">
                  {JSON.stringify(
                    {
                      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
                      NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnon
                        ? supabaseAnon.replace(/.(?=.{4})/g, '*')
                        : null,
                    },
                    null,
                    2
                  )}
                </pre>
                <div>lastRequest</div>
                <pre className="overflow-x-auto">
                  {JSON.stringify(lastRequest, null, 2)}
                </pre>
                <div>lastResponse</div>
                <pre className="overflow-x-auto">
                  {JSON.stringify(lastResponse, null, 2)}
                </pre>
                <Button size="sm" onClick={runTest}>
                  Test direct
                </Button>
                {testResult && (
                  <pre className="overflow-x-auto">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
