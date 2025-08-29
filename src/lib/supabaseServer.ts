import { cookies } from "next/headers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function createServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing Supabase server env vars");
  }
  const cookieStore = cookies();
  const access = cookieStore.get("sb-access-token")?.value;
  return createClient(url, serviceKey, {
    global: { headers: access ? { Authorization: `Bearer ${access}` } : {} },
  });
}

export async function getSession() {
  const supabase = createServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function isAdmin() {
  const supabase = createServerClient();
  const { data: allowed } = await supabase.rpc("is_admin");
  if (allowed) return true;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("admins")
    .select("id")
    .eq("id", user.id)
    .single();
  return !!data;
}

export { createServerClient };
