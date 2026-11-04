import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const cookies = request.headers.get('cookie') || ''
  const hasAuth = cookies.includes('sb-') || cookies.includes('auth-token')

  const isProtected =
    path.startsWith('/dashboard') ||
    path.startsWith('/customers') ||
    path.startsWith('/devices') ||
    path.startsWith('/repairs') ||
    path.startsWith('/sales') ||
    path.startsWith('/accessories') ||
    path.startsWith('/expenses') ||
    path.startsWith('/reports') ||
    path.startsWith('/staff') ||
    path.startsWith('/apprentices') ||
    path.startsWith('/settings') ||
    path.startsWith('/receipt')

  const isAuthPage = path.startsWith('/login')

  if (isProtected && !hasAuth) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthPage && hasAuth) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/customers/:path*',
    '/devices/:path*',
    '/repairs/:path*',
    '/sales/:path*',
    '/accessories/:path*',
    '/expenses/:path*',
    '/reports/:path*',
    '/staff/:path*',
    '/apprentices/:path*',
    '/settings/:path*',
    '/receipt/:path*',
    '/login',
  ],
}