import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
    try {
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

        const ticketRef = adminDb.collection('tickets').doc(ticketId);
        const ticketDoc = await ticketRef.get();

        if (!ticketDoc.exists) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        const ticket = ticketDoc.data();
        if (ticket?.userId !== decodedToken.uid) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        if (ticket.status !== 'Open') {
            return NextResponse.json({ error: 'Only open tickets can be cancelled' }, { status: 400 });
        }

        await ticketRef.update({
            status: 'Cancelled',
            updatedAt: FieldValue.serverTimestamp()
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Cancel ticket error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
