import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { createClient } from '@/utils/supabase/server'

export async function middleware(request: NextRequest) {
  // 1) Toujours rafraîchir la session (pose les cookies à jour)
  let response = await updateSession(request)

  // 2) Ne protéger que /admin/*
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    const user = data?.user
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }
  return response
}

export const config = {
  matcher: [
    // Ne pas matcher les assets :
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
