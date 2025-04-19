import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from './lib/firebase-admin';

initAdmin();

export async function middleware(request: NextRequest) {
    const session = request.cookies.get('session')?.value || '';

    // Return early if no session exists
    if (!session) {
        return redirectToLogin(request);
    }

    try {
        // Verify session cookie
        const decodedClaims = await getAuth().verifySessionCookie(session, true);
        
        // If session is valid, check if user profile is complete
        if (request.nextUrl.pathname.startsWith('/dashboard') && 
            request.nextUrl.pathname !== '/dashboard/profile') {
            
            const db = getFirestore();
            const userDoc = await db.collection('users').doc(decodedClaims.uid).get();
            const userData = userDoc.data();

            if (!userData?.profileCompleted) {
                // Redirect to profile page if profile is not complete
                return NextResponse.redirect(new URL('/dashboard/profile', request.url));
            }
        }

        return NextResponse.next();
    } catch (error) {
        return redirectToLogin(request);
    }
}

function redirectToLogin(request: NextRequest) {
    const redirectUrl = new URL('/auth', request.url);
    return NextResponse.redirect(redirectUrl);
}

// Specify which routes should be protected
export const config = {
    matcher: [
        '/dashboard/:path*',
    ],
}