'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import MotoCard from '@/components/MotoCard';
import FiltersPanel from '@/components/FiltersPanel';
import { useMotoFacets } from '@/hooks/useMotoFacets';
import { useMotoSearch } from '@/hooks/useMotoSearch';
import { Filters } from '@/types/filters';
import { encodeState, decodeState } from '@/lib/urlState';
import { Drawer, DrawerTrigger, DrawerContent } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { X } from 'lucide-react';

function findFacetItem(facets: any[], key: string) {
  for (const g of facets) {
    const it = g.items.find((i: any) => i.key === key);
    if (it) return it;
  }
  return null;
}

export default function MotosPage() {
  const searchParams = useSearchParams();
  const initial = useMemo(() => decodeState(searchParams.get('f')), [searchParams]);
  const [filters, setFilters] = useState<Filters>(initial?.filters || {});
  const [page, setPage] = useState<number>(initial?.page || 0);

  const { facets } = useMotoFacets();
  const { motos, loading, pageSize } = useMotoSearch(filters, page);

  useEffect(() => {
    const encoded = encodeState(filters, page);
    const url = encoded ? `?f=${encoded}` : '';
    window.history.replaceState(null, '', url);
  }, [filters, page]);

  const removeFilter = (key: string) => {
    setFilters((prev) => {
      const next = { ...prev } as Filters;
      if (key === 'price' || key === 'year') {
        delete (next as any)[key];
      } else if (key === 'brand_ids') {
        delete next.brand_ids;
      } else if (next.specs) {
        delete next.specs[key];
        if (Object.keys(next.specs).length === 0) delete next.specs;
      }
      return next;
    });
    setPage(0);
  };

  const badges = useMemo(() => {
    const items: { key: string; label: string }[] = [];
    if (filters.price) {
      const it = findFacetItem(facets, 'price');
      items.push({
        key: 'price',
        label: `${it?.label ?? 'price'} ${filters.price.min ?? ''}–${filters.price.max ?? ''} ${it?.unit ?? ''}`.trim(),
      });
    }
    if (filters.year) {
      const it = findFacetItem(facets, 'year');
      items.push({
        key: 'year',
        label: `${it?.label ?? 'year'} ${filters.year.min ?? ''}–${filters.year.max ?? ''} ${it?.unit ?? ''}`.trim(),
      });
    }
    if (filters.brand_ids && filters.brand_ids.length) {
      const it = findFacetItem(facets, 'brand_ids');
      items.push({
        key: 'brand_ids',
        label: `${it?.label ?? 'brand'} ${filters.brand_ids.join(', ')}`,
      });
    }
    if (filters.specs) {
      Object.entries(filters.specs).forEach(([k, v]) => {
        const it = findFacetItem(facets, k);
        let value = '';
        if (typeof v === 'boolean') value = v ? 'Oui' : 'Non';
        else if (typeof v === 'string') value = v;
        else if (Array.isArray(v)) value = v.join(', ');
        else if (v && typeof v === 'object' && 'in' in v) value = (v.in as string[]).join(', ');
        else if (v && typeof v === 'object')
          value = `${(v as any).min ?? ''}–${(v as any).max ?? ''} ${it?.unit ?? ''}`.trim();
        items.push({ key: k, label: `${it?.label ?? k} ${value}`.trim() });
      });
    }
    return items;
  }, [filters, facets]);

  const resetAll = () => {
    setFilters({});
    setPage(0);
  };

  return (
    <div className="flex">
      <aside className="hidden md:block w-64 p-4 border-r">
        <FiltersPanel
          facets={facets}
          filters={filters}
          onChange={(f) => {
            setFilters(f);
            setPage(0);
          }}
          onReset={resetAll}
        />
      </aside>
      <div className="flex-1 p-4">
        <div className="md:hidden mb-4">
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline">Filtres</Button>
            </DrawerTrigger>
            <DrawerContent className="p-4">
              <FiltersPanel
                facets={facets}
                filters={filters}
                onChange={(f) => {
                  setFilters(f);
                  setPage(0);
                }}
                onReset={resetAll}
              />
            </DrawerContent>
          </Drawer>
        </div>

        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {badges.map((b) => (
              <Button
                key={b.key}
                variant="secondary"
                size="sm"
                onClick={() => removeFilter(b.key)}
              >
                {b.label}
                <X className="ml-1 h-3 w-3" />
              </Button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-60 w-full" />
            ))}
          </div>
        ) : motos.length === 0 ? (
          <div>Aucun résultat, essayez d’élargir les filtres</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {motos.map((m) => (
              <MotoCard key={m.id} moto={m} />
            ))}
          </div>
        )}

        <div className="flex justify-between mt-4">
          <Button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            Précédent
          </Button>
          <Button disabled={motos.length < pageSize} onClick={() => setPage((p) => p + 1)}>
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
}
