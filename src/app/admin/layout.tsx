import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .limit(1)

  if (error || !data?.length) redirect('/')

  return <section>{children}</section>
}
