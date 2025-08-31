const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;

export function resolveImageUrl(input?: string | null): string | null {
  if (!input) return null;
  const s = input.trim();
  if (!s) return null;
  // Si c'est déjà une URL absolue
  if (/^https?:\/\//i.test(s)) return s;
  // Si ça ressemble à un chemin de bucket public
  // exemples valides en base: "public/motos/2.webp" ou "motos/ID/1.png"
  const path = s.replace(/^\/+/, '');
  if (!BASE) return null;
  // On force le chemin sous /storage/v1/object/public/
  // Si l'entrée commence par "public/", on ne le double pas
  const finalPath = path.startsWith('storage/v1/object/public/')
    ? path
    : `storage/v1/object/public/${path}`;
  return `${BASE.replace(/\/+$/, '')}/${finalPath}`;
}
