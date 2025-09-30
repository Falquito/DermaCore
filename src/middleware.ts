import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = new Set(['/', '/login', '/register', '/_next', '/favicon.ico'])

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  // Only protect role routes basic check client-side; server pages also check.
  const isPublic = Array.from(PUBLIC_PATHS).some((p) => pathname === p || pathname.startsWith(p + '/'))

  const token = req.cookies.get('session')?.value
  if (!isPublic && !token) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/profesional/:path*', '/mesa-entrada/:path*', '/gerente/:path*', '/login', '/register'],
}
