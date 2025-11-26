import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminAuth } from '@/lib/firebase-admin'; // Use adminAuth directly
import { getUserRole } from '@/lib/auth-utils';

// Set session expiration to 5 days
const SESSION_EXPIRATION = 60 * 60 * 24 * 5 * 1000;

export async function POST(request: NextRequest) {
    try {
        if (!adminAuth) {
            console.error('Firebase Admin SDK not initialized');
            return new NextResponse('Server configuration error', { status: 500 });
        }

        const { idToken } = await request.json();
        
        if (!idToken) {
            return new NextResponse('Missing ID token', { status: 400 });
        }

        // Verify ID token to get the user ID
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const userId = decodedToken.uid;

        // Create session cookie
        const sessionCookie = await adminAuth.createSessionCookie(idToken, {
            expiresIn: SESSION_EXPIRATION,
        });

        // Set cookie options
        const options = {
            name: 'session',
            value: sessionCookie,
            maxAge: SESSION_EXPIRATION,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const,
            path: '/',
        };

        // Set the cookie
        cookies().set(options);

        // Get user role for response
        const userRole = await getUserRole(userId);

        return new NextResponse(JSON.stringify({ 
            status: 'success',
            role: userRole,
            permissions: {
                canModifyUsers: userRole === 'admin',
                canViewAdminPanel: userRole === 'admin' || userRole === 'support',
                isReadOnly: userRole === 'support'
            }
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error: any) {
        console.error('Session creation error:', error);
        const errorMessage = error.message || 'Internal server error';
        return new NextResponse(JSON.stringify({ error: errorMessage }), { 
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
}

export async function DELETE() {
    try {
        // Clear the session cookie
        cookies().delete('session');
        
        return new NextResponse(JSON.stringify({ status: 'success' }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('Session deletion error:', error);
        return new NextResponse('Internal server error', { status: 500 });
    }
}