import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export function validatePaystackWebhook(
    request: NextRequest,
    body: string
): boolean {
    try {
        const hash = crypto
            .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '')
            .update(body)
            .digest('hex');
        
        const signature = request.headers.get('x-paystack-signature');
        return hash === signature;
    } catch (error) {
        console.error('Webhook validation error:', error);
        return false;
    }
}

export async function validatePaystackRequest(request: NextRequest) {
    // Always validate POST requests
    if (request.method !== 'POST') {
        return new NextResponse('Method not allowed', { status: 405 });
    }

    try {
        // Clone the request to read the body
        const clone = request.clone();
        let body;
        try {
            body = await clone.text();
            if (!body) {
                return new NextResponse('Empty request body', { status: 400 });
            }
        } catch (e) {
            return new NextResponse('Error reading request body', { status: 400 });
        }

        // Validate webhook signature
        if (!validatePaystackWebhook(request, body)) {
            console.error('Invalid webhook signature');
            return new NextResponse('Invalid signature', { status: 401 });
        }

        return null; // No error
    } catch (error) {
        console.error('Webhook validation error:', error);
        return new NextResponse('Validation error', { status: 400 });
    }
}
