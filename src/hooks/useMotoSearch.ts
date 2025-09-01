'use client';

import { useEffect, useState } from 'react';
import { Filters } from '@/types/filters';
import { toast } from '@/hooks/use-toast';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const PAGE_SIZE = 24;

export function useMotoSearch(filters: Filters, page: number) {
  const [motos, setMotos] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let aborted = false;
    const search = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/rpc/fn_search_motos`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              p_filters: filters,
              p_limit: PAGE_SIZE,
              p_offset: page * PAGE_SIZE,
            }),
          }
        );
        if (!res.ok) {
          throw new Error(await res.text());
        }
        const json = await res.json();
        if (!aborted) setMotos(Array.isArray(json) ? json : []);
      } catch (err) {
        const e = err as Error;
        if (!aborted) {
          setError(e);
          toast({ description: e.message });
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    };
    search();
    return () => {
      aborted = true;
    };
  }, [filters, page]);

  return { motos, loading, error, pageSize: PAGE_SIZE };
}
