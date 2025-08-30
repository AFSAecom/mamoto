'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    redirect('/login?err=1')
  }
  // Redirige côté serveur => cookies déjà posés
  redirect('/admin')
}
