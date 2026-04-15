import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const ROUTE_ROLES: Record<string, string[]> = {
  '/dashboard':    ['super_admin', 'director'],
  '/tablero':      ['super_admin', 'operator'],
  '/contenedores': ['super_admin', 'operator'],
  '/clientes':     ['super_admin', 'operator'],
  '/facturas':     ['super_admin', 'operator'],
  '/admin':        ['super_admin'],
}

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request)
  const pathname = request.nextUrl.pathname

  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  const allowedRoles = ROUTE_ROLES[pathname]
  if (allowedRoles) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !allowedRoles.includes(profile.role)) {
      const redirect = request.nextUrl.clone()
      redirect.pathname = profile?.role === 'director' ? '/dashboard' : '/tablero'
      return NextResponse.redirect(redirect)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login|auth).*)'],
}
