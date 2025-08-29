import { getSupabaseClient } from './supabaseClient';

export async function getCurrentUser() {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data: { user } } = await client.auth.getUser();
  return user ?? null;
}

export async function isAdmin(): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { data, error } = await client.rpc('is_admin');
  if (error) return false;
  return !!data;
}
