import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Use path pattern matching instead of regex
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth/')
  const isApiAuthRoute = request.nextUrl.pathname.startsWith('/api/auth/')
  
  // Skip middleware for API and auth routes
  if (isAuthPage || isApiAuthRoute) {
    return NextResponse.next()
  }

  // Add your other middleware logic here
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
