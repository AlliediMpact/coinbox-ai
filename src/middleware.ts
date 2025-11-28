import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    try {
        // Bypass all auth in development mode
        const isDevelopment = process.env.NODE_ENV === 'development';
        
        if (isDevelopment) {
            console.log('⚠️ Running in dev mode - bypassing all auth middleware');
            return NextResponse.next();
        }

        const sessionCookie = request.cookies.get('session')?.value || '';

        if (!sessionCookie) {
            return redirectToLogin(request);
        }

        // Verify session through API route instead of directly
        const verifyResponse = await fetch(new URL('/api/auth/verify', request.url), {
            headers: {
                Cookie: `session=${sessionCookie}`
            }
        });

        if (!verifyResponse.ok) {
            return redirectToLogin(request);
        }

        return NextResponse.next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return redirectToLogin(request);
    }
}

function redirectToLogin(request: NextRequest) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    url.search = `redirect=${request.nextUrl.pathname}`
    return NextResponse.redirect(url)
}

// Specify which routes should be protected
export const config = {
    matcher: [
        '/dashboard/:path*',
        '/api/trading/:path*',
        '/api/tickets/:path*',
        '/api/escrow/:path*',
    ],
}