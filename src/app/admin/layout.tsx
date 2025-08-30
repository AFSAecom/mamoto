import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Vérif admin : RPC is_admin() puis fallback table admins
  let isAdmin = false
  const { data: rpcData } = await supabase.rpc('is_admin')
  if (rpcData === true) isAdmin = true
  if (!isAdmin) {
    const { data: rows } = await supabase.from('admins').select('user_id').eq('user_id', user.id).limit(1)
    if ((rows?.length ?? 0) > 0) isAdmin = true
  }
  if (!isAdmin) redirect('/')

  return <section>{children}</section>
}
