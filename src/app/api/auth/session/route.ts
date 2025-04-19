import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebase-admin';

// Initialize Firebase Admin
initAdmin();

// Set session expiration to 5 days
const SESSION_EXPIRATION = 60 * 60 * 24 * 5 * 1000;

export async function POST(request: NextRequest) {
    try {
        const { idToken } = await request.json();
        
        if (!idToken) {
            return new NextResponse('Missing ID token', { status: 400 });
        }

        // Create session cookie
        const sessionCookie = await getAuth().createSessionCookie(idToken, {
            expiresIn: SESSION_EXPIRATION,
        });

        // Set cookie options
        const options = {
            name: 'session',
            value: sessionCookie,
            maxAge: SESSION_EXPIRATION,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
        };

        // Set the cookie
        cookies().set(options);

        return new NextResponse(JSON.stringify({ status: 'success' }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('Session creation error:', error);
        return new NextResponse('Internal server error', { status: 500 });
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