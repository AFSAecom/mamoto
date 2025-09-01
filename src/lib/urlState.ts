import { Filters } from '@/types/filters';

export function encodeState(filters: Filters, page: number): string {
  const payload = JSON.stringify({ filters, page });
  return Buffer.from(payload).toString('base64url');
}

export function decodeState(param: string | null): { filters: Filters; page: number } | null {
  if (!param) return null;
  try {
    const json = Buffer.from(param, 'base64url').toString();
    const parsed = JSON.parse(json);
    return {
      filters: parsed.filters || {},
      page: typeof parsed.page === 'number' ? parsed.page : 0,
    };
  } catch {
    return null;
  }
}
