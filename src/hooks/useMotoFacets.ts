import { useEffect, useState } from 'react';

export function useMotoFacets() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const [facets, setFacets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${url}/rest/v1/rpc/fn_get_filter_facets`, {
          method: 'POST',
          headers: {
            apikey: anon,
            Authorization: `Bearer ${anon}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });
        const raw = await res.json().catch(() => null);
        if (!res.ok) throw new Error(`HTTP ${res.status} – ${JSON.stringify(raw)}`);
        if (!cancelled) {
          // Tri basique si metadata absentes
          const groups = Array.isArray(raw) ? raw : [];
          setFacets(groups);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [url, anon]);

  return { facets, loading, error };
}

