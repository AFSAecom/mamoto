import { getSupabaseClient } from "./supabaseClient";

export async function getCurrentUser() {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

export async function isAdmin(): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("is_admin");
  if (error) return false;
  return !!data;
}
