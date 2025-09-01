import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Ensure Supabase client is created only once
let client: SupabaseClient

if (!(globalThis as any).__supabase) {
  ;(globalThis as any).__supabase = createClient(url, key)
}

client = (globalThis as any).__supabase as SupabaseClient

export const supabase = client

