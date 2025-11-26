import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { tradingRateLimitMiddleware } from './middleware/trading-rate-limit'

export async function middleware(request: NextRequest) {
    try {
        // Apply trading rate limits
        if (request.nextUrl.pathname.startsWith('/api/trading') || 
            request.nextUrl.pathname.startsWith('/api/tickets') || 
            request.nextUrl.pathname.startsWith('/api/escrow')) {
            const rateLimitResponse = await tradingRateLimitMiddleware(request);
            if (rateLimitResponse.status !== 200) return rateLimitResponse;
        }

        const sessionCookie = request.cookies.get('session')?.value || '';

        if (!sessionCookie) {
            return redirectToLogin(request);
        }

        // Verify session through API route instead of directly
        const verifyResponse = await fetch('/api/auth/verify', {
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
    ],
}