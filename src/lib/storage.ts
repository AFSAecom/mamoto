/**
 * Construit l'URL publique d'une image Supabase Storage à partir d'un "path"
 * Exemple: path = "motos/bmw-f900r/1.webp"
 * URL = https://dolzaahnywrxdsdcgepl.supabase.co/storage/v1/object/public/motos/bmw-f900r/1.webp
 */
const SUPABASE_PROJECT_URL = 'https://dolzaahnywrxdsdcgepl.supabase.co' // fixe (fourni par l'utilisateur)

export function publicImageUrlFromPath(path?: string | null): string | null {
  if (!path) return null
  // Nettoyage simple
  const clean = path.replace(/^\/+/, '')
  return `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${clean}`
}

export const publicImageUrl = publicImageUrlFromPath
