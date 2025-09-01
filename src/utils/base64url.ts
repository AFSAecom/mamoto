export function encode(data: any): string {
  try {
    const json = typeof data === 'string' ? data : JSON.stringify(data);
    const base64 = typeof window === 'undefined'
      ? Buffer.from(json).toString('base64')
      : window.btoa(json);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch {
    return '';
  }
}

export function decode<T = any>(value: string): T {
  try {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4
      ? base64 + '='.repeat(4 - (base64.length % 4))
      : base64;
    const json = typeof window === 'undefined'
      ? Buffer.from(pad, 'base64').toString()
      : window.atob(pad);
    return JSON.parse(json) as T;
  } catch {
    return {} as T;
  }
}
