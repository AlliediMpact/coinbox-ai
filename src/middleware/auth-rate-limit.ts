import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit } from './middleware/rate-limit';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if this is an auth-related endpoint that needs rate limiting
  const isAuthEndpoint = pathname.startsWith('/api/auth') || 
                         pathname.startsWith('/auth/');

  if (isAuthEndpoint) {
    const isAllowed = await rateLimit(request);
    
    if (!isAllowed) {
      const { AuthErrors } = await import('./app/api-utils');
      
      // Calculate retry-after time (in seconds)
      const retryAfterSeconds = pathname.includes('/api/auth/login') ? 15 * 60 : 60 * 60;
      
      // For API endpoints, return JSON error
      if (pathname.startsWith('/api/')) {
        return AuthErrors.rateLimited(
          'Too many requests. Please try again later.',
          retryAfterSeconds
        );
      }
      
      // For UI routes, redirect to an error page
      return NextResponse.redirect(
        new URL(`/auth/error?code=rate-limited&retryAfter=${retryAfterSeconds}`, request.url)
      );
    }
  }
  
  // Continue with normal request handling
  return NextResponse.next();
}

// Apply specifically to auth endpoints
export const config = {
  matcher: [
    '/api/auth/:path*',
    '/auth/:path*',
  ]
};
