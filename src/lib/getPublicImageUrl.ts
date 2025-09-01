import { supabase } from './supabaseClient';

/**
 * Resolve a public URL for a moto image stored in Supabase storage.
 * Accepts absolute URLs and returns them unchanged.
 * For relative paths, it removes a leading `motos/` segment then
 * uses Supabase to generate a public URL with a fallback to the
 * environment base URL.
 */
export function getPublicImageUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const removePrefix = path.replace(/^motos\//, '');
  const { data } = supabase.storage.from('motos').getPublicUrl(removePrefix);
  return (
    data?.publicUrl ??
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/motos/${removePrefix}`
  );
}

export default getPublicImageUrl;
