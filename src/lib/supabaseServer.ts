import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from './types'; // facultatif si tu l’as

export function supabaseServer() {
  return createServerComponentClient<Database>({ cookies });
}
