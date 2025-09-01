import { useEffect, useState } from 'react';

export type Range = { min?: number; max?: number };
export type Filters = {
  price?: Range;
  year?: Range;
  brand_ids?: string[];
  specs?: Record<string, boolean | string | string[] | Range | { in: string[] }>;
};

export function cleanFilters(input: Filters): Filters {
  const out: Filters = {};
  if (input.price && (input.price.min != null || input.price.max != null)) out.price = input.price;
  if (input.year && (input.year.min != null || input.year.max != null)) out.year = input.year;
  if (input.brand_ids && input.brand_ids.length) out.brand_ids = input.brand_ids;

  if (input.specs) {
    const s: NonNullable<Filters['specs']> = {};
    for (const [k, v] of Object.entries(input.specs)) {
      if (v === undefined || v === null) continue;
      if (typeof v === 'string' && v.trim() === '') continue;
      if (Array.isArray(v) && v.length === 0) continue;
      if (typeof v === 'object' && !Array.isArray(v)) {
        const hasAny =
          ('min' in v && (v as any).min != null) ||
          ('max' in v && (v as any).max != null) ||
          ('in' in v && Array.isArray((v as any).in) && (v as any).in.length > 0);
        if (!hasAny) continue;
      }
      s[k] = v as any;
    }
    if (Object.keys(s).length) out.specs = s;
  }
  return out;
}

function normalizeRows(rows: any[]): any[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((r: any) => {
    if (r && typeof r === 'object') {
      if ('fn_search_motos' in r) return (r as any).fn_search_motos; // cas actuel
      if ('j' in r) return (r as any).j;                              // variante aliasée
      return r;                                                       // déjà l'objet moto
    }
    return r;
  });
}

export function useMotoSearch(filters: Filters, page: number) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const [motos, setMotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<any>(null);
  const [lastResponse, setLastResponse] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      const body = {
        p_filters: cleanFilters(filters),
        p_limit: 24,
        p_offset: Math.max(0, page) * 24,
      };
      setLastRequest(body);
      try {
        const res = await fetch(`${url}/rest/v1/rpc/fn_search_motos`, {
          method: 'POST',
          headers: {
            apikey: anon,
            Authorization: `Bearer ${anon}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        const raw = await res.json().catch(() => null);
        setLastResponse(raw);
        if (!res.ok) throw new Error(`HTTP ${res.status} – ${JSON.stringify(raw)}`);
        const list = normalizeRows(raw);
        if (!cancelled) setMotos(list);
        // logs dev
        console.debug('[filters->RPC]', body.p_filters);
        console.debug('[RPC->rows]', raw);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    // IMPORTANT: aucun debounce → chaque changement déclenche la requête
    run();
    return () => { cancelled = true; };
  }, [filters, page, url, anon]);

  return { motos, loading, error, lastRequest, lastResponse };
}

