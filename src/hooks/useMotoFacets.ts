'use client';

import { useEffect, useState } from 'react';
import { FacetGroup } from '@/types/filters';
import { toast } from '@/hooks/use-toast';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function useMotoFacets() {
  const [facets, setFacets] = useState<FacetGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchFacets = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/rpc/fn_get_filter_facets`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: '{}',
          }
        );
        if (!res.ok) {
          throw new Error(await res.text());
        }
        const json = await res.json();
        const groups: FacetGroup[] = (Array.isArray(json)
          ? json
          : Object.values(json))
          .map((g: any) => ({
            key: g.key || g.group_key || g.name,
            label: g.label || g.group_label || g.name,
            group_sort: g.group_sort,
            items: (g.items || []).map((i: any) => ({
              key: i.key,
              label: i.label,
              unit: i.unit,
              type: i.type,
              min: i.min,
              max: i.max,
              dist_bool: i.dist_bool,
              dist_text: i.dist_text,
              item_sort: i.item_sort,
            }))
              .sort((a: any, b: any) =>
                (a.item_sort ?? 0) - (b.item_sort ?? 0) || a.label.localeCompare(b.label)
              ),
          }))
          .sort((a: any, b: any) =>
            (a.group_sort ?? 0) - (b.group_sort ?? 0) || a.label.localeCompare(b.label)
          );
        setFacets(groups);
      } catch (err) {
        const e = err as Error;
        setError(e);
        toast({ description: e.message });
      } finally {
        setLoading(false);
      }
    };

    fetchFacets();
  }, []);

  return { facets, loading, error };
}
