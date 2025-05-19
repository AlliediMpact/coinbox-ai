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

    // Clone the request to read the body
    const clone = request.clone();
    const body = await clone.text();

    // Validate webhook signature
    if (!validatePaystackWebhook(request, body)) {
        console.error('Invalid webhook signature');
        return new NextResponse('Invalid signature', { status: 401 });
    }

    return null; // No error
}
