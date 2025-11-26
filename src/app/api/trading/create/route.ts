import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { tradingRateLimit } from '@/middleware/trading-rate-limit';

export async function POST(request: NextRequest) {
    try {
        // Apply rate limiting
        const isAllowed = await tradingRateLimit(request, 'create');
        if (!isAllowed) {
            return NextResponse.json({ 
                success: false,
                error: 'Rate limit exceeded for creating trading tickets. Please try again later.' 
            }, { status: 429 });
        }

        if (!adminDb || !adminAuth) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // Verify authentication
        const sessionCookie = request.cookies.get('session')?.value;
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let decodedToken;
        try {
            decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
        } catch (error) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        const userId = decodedToken.uid;
        const body = await request.json();
        
        // Validate body
        if (!body.type || !body.amount || !body.interest) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Create ticket
        const ticket = {
            userId,
            type: body.type,
            amount: body.amount,
            interest: body.interest,
            status: 'Open',
            description: body.description || '',
            membershipTier: body.membershipTier || 'Basic',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        };

        const docRef = await adminDb.collection('tickets').add(ticket);
        
        return NextResponse.json({ 
            success: true, 
            ticket: { id: docRef.id, ...ticket } 
        });

    } catch (error: any) {
        console.error('Create ticket error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
