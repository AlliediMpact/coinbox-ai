import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { tradingRateLimit } from '@/middleware/trading-rate-limit';

export async function POST(request: NextRequest) {
    try {
        // Apply rate limiting
        const isAllowed = await tradingRateLimit(request, 'match');
        if (!isAllowed) {
            return NextResponse.json({ 
                success: false,
                error: 'Rate limit exceeded for matching trades. Please try again later.' 
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

        const body = await request.json();
        const { ticketId } = body;

        if (!ticketId) {
            return NextResponse.json({ error: 'Missing ticket ID' }, { status: 400 });
        }

        // Get the ticket
        const ticketDoc = await adminDb.collection('tickets').doc(ticketId).get();
        if (!ticketDoc.exists) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        const ticket = ticketDoc.data();
        if (!ticket) return NextResponse.json({ error: 'Ticket data empty' }, { status: 500 });

        // Find matches
        // Logic: Find tickets of opposite type, same amount, status Open
        const oppositeType = ticket.type === 'Borrow' ? 'Invest' : 'Borrow';
        
        const matchesSnapshot = await adminDb.collection('tickets')
            .where('type', '==', oppositeType)
            .where('status', '==', 'Open')
            .where('amount', '==', ticket.amount)
            .orderBy('createdAt', 'asc')
            .get();

        if (matchesSnapshot.empty) {
            return NextResponse.json({ match: null });
        }

        // Simple matching strategy: return the first one (oldest)
        // In a real scenario, we would do risk assessment here
        const matchDoc = matchesSnapshot.docs[0];
        const match = { id: matchDoc.id, ...matchDoc.data() };

        return NextResponse.json({ match });

    } catch (error: any) {
        console.error('Find match error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
