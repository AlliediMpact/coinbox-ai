import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // In development, allow through without session verification
        if (process.env.NODE_ENV === 'development') {
            return new NextResponse('OK', { status: 200 });
        }

        const sessionCookie = request.cookies.get('session')?.value;
        
        if (!sessionCookie) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
        const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();

        if (!userDoc.exists) {
            return new NextResponse('User not found', { status: 401 });
        }

        return new NextResponse('OK', { status: 200 });
    } catch (error) {
        console.error('Session verification error:', error);
        return new NextResponse('Unauthorized', { status: 401 });
    }
}
