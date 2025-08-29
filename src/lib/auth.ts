import { supabaseClient } from "./supabaseClient";

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();
  return user ?? null;
}

export async function isAdmin(): Promise<boolean> {
  const { data, error } = await supabaseClient.rpc("is_admin");
  if (error) return false;
  return !!data;
}
