import { getSupabaseClient } from './supabaseClient';

export async function getCurrentUser() {
  const { data: { user } } = await getSupabaseClient().auth.getUser();
  return user ?? null;
}

export async function isAdmin(): Promise<boolean> {
  const { data, error } = await getSupabaseClient().rpc('is_admin');
  if (error) return false;
  return !!data;
}
