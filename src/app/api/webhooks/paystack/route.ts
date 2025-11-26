import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { enhancedPaystackService, WebhookEvent } from '@/lib/paystack-service-enhanced';
import { validatePaymentServer } from '@/lib/payment-validator';
import { emailService } from '@/lib/email-service';
import { receiptService } from '@/lib/receipt-service';
import { adminDb } from '@/lib/firebase-admin';
import crypto from 'crypto';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

/**
 * Verify that the request is coming from Paystack
 */
function verifyPaystackSignature(payload: any, signature: string): boolean {
  if (!PAYSTACK_SECRET) {
    console.error('Paystack secret key is not set');
    return false;
  }
  
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
    
  return hash === signature;
}

/**
 * Handle Paystack webhook events
 */
export async function POST(request: Request) {
  try {
    // Get the signature from the headers
    const headersList = headers();
    const signature = headersList.get('x-paystack-signature');
    
    if (!signature) {
      console.error('No Paystack signature found in request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the request body
    const payload = await request.json();
    
    // Verify the request is from Paystack
    if (!verifyPaystackSignature(payload, signature)) {
      console.error('Invalid Paystack signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    // Event handling based on event type
    const { event, data } = payload;
    console.log(`Processing Paystack webhook: ${event}`, data?.reference);
    
    switch (event) {
      case 'charge.success':
        await handleSuccessfulPayment(data);
        break;
        
      case 'subscription.create':
        await handleSubscriptionCreated(data);
        break;
        
      case 'subscription.disable':
        await handleSubscriptionDisabled(data);
        break;
        
      case 'transfer.success':
        await handleTransferSuccess(data);
        break;
        
      case 'transfer.failed':
        await handleTransferFailed(data);
        break;
        
      default:
        // Log unknown events but return success
        console.log(`Unhandled Paystack webhook event: ${event}`);
    }
    
    // Acknowledge receipt of the webhook
    return NextResponse.json({ received: true });
    
  } catch (error: any) {
    console.error('Error processing Paystack webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment
 */
async function handleSuccessfulPayment(data: any) {
  try {
    const { reference, amount, customer, metadata } = data;
    
    // Validate the payment data
    const isValid = await validatePaymentServer(
      reference,
      amount // validatePaymentServer expects kobo
    );
    
    if (!isValid.success) {
      console.error('Invalid payment data:', isValid.error);
      return;
    }
    
    // Get the user ID from metadata or look up by email
    const userId = metadata?.userId || await getUserIdFromEmail(customer.email);
    
    if (!userId) {
      console.error('User ID not found for payment:', reference);
      return;
    }
    
    // Store the payment in the database
    const paymentRef = adminDb.collection('payments').doc(reference);
    await paymentRef.set({
      userId,
      email: customer.email,
      amount: amount / 100,
      currency: data.currency,
      reference,
      status: 'success',
      metadata: metadata || {},
      createdAt: new Date(),
      paystackData: data
    });
    
    // Update the user's subscription status if applicable
    if (metadata?.type === 'subscription') {
      await updateUserSubscription(userId, metadata.planId, data);
    }
    
    // Send payment confirmation email
    await emailService.sendPaymentConfirmationEmail({
      email: customer.email,
      amount: amount / 100,
      currency: data.currency,
      reference,
      date: new Date().toISOString()
    });
    
    console.log(`Payment processed successfully: ${reference} for user ${userId}`);
    
  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

/**
 * Handle subscription creation
 */
async function handleSubscriptionCreated(data: any) {
  try {
    const { customer, plan, subscription_code } = data;
    
    // Get the user ID from email
    const userId = await getUserIdFromEmail(customer.email);
    
    if (!userId) {
      console.error('User ID not found for subscription:', subscription_code);
      return;
    }
    
    // Update user's subscription in the database
    await adminDb.collection('users').doc(userId).update({
      'membership.planId': plan.id,
      'membership.planName': plan.name,
      'membership.subscriptionCode': subscription_code,
      'membership.status': 'active',
      'membership.startDate': new Date(),
      'membership.nextBillingDate': new Date(data.next_payment_date),
      'membership.updatedAt': new Date()
    });
    
    console.log(`Subscription created: ${subscription_code} for user ${userId}`);
    
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

/**
 * Handle subscription disabled
 */
async function handleSubscriptionDisabled(data: any) {
  try {
    const { customer, subscription_code } = data;
    
    // Find the user by subscription code
    const usersRef = adminDb.collection('users');
    const snapshot = await usersRef.where('membership.subscriptionCode', '==', subscription_code).get();
    
    if (snapshot.empty) {
      console.error('No user found with subscription code:', subscription_code);
      return;
    }
    
    // Update the user's subscription status
    const userDoc = snapshot.docs[0];
    await userDoc.ref.update({
      'membership.status': 'inactive',
      'membership.canceledAt': new Date(),
      'membership.updatedAt': new Date()
    });
    
    console.log(`Subscription disabled: ${subscription_code} for user ${userDoc.id}`);
    
  } catch (error) {
    console.error('Error handling subscription disabled:', error);
  }
}

/**
 * Handle successful transfer
 */
async function handleTransferSuccess(data: any) {
  try {
    const { reference, recipient, amount } = data;
    
    // Log the successful transfer
    await adminDb.collection('transfers').doc(reference).set({
      status: 'success',
      recipient,
      amount: amount / 100,
      reference,
      completedAt: new Date(),
      rawData: data
    });
    
    console.log(`Transfer successful: ${reference} to ${recipient.email}`);
    
  } catch (error) {
    console.error('Error handling transfer success:', error);
  }
}

/**
 * Handle failed transfer
 */
async function handleTransferFailed(data: any) {
  try {
    const { reference, recipient, amount } = data;
    
    // Log the failed transfer
    await adminDb.collection('transfers').doc(reference).set({
      status: 'failed',
      recipient,
      amount: amount / 100,
      reference,
      failedAt: new Date(),
      reason: data.reason,
      rawData: data
    });
    
    console.log(`Transfer failed: ${reference} to ${recipient.email}: ${data.reason}`);
    
  } catch (error) {
    console.error('Error handling transfer failed:', error);
  }
}

/**
 * Get user ID from email
 */
async function getUserIdFromEmail(email: string): Promise<string | null> {
  try {
    const usersRef = adminDb.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();
    
    if (snapshot.empty) {
      return null;
    }
    
    return snapshot.docs[0].id;
  } catch (error) {
    console.error('Error getting user ID from email:', error);
    return null;
  }
}

/**
 * Update user subscription
 */
async function updateUserSubscription(userId: string, planId: string, paymentData: any) {
  try {
    // Get the plan details
    const planRef = adminDb.collection('plans').doc(planId);
    const planDoc = await planRef.get();
    
    if (!planDoc.exists) {
      console.error('Plan not found:', planId);
      return;
    }
    
    const plan = planDoc.data();
    
    // Calculate expiration date based on plan duration
    const now = new Date();
    const expirationDate = new Date();
    
    if (plan?.duration === 'monthly') {
      expirationDate.setMonth(now.getMonth() + 1);
    } else if (plan?.duration === 'yearly') {
      expirationDate.setFullYear(now.getFullYear() + 1);
    } else {
      // Default to 30 days if duration is not specified
      expirationDate.setDate(now.getDate() + 30);
    }
    
    // Update user's subscription in the database
    await adminDb.collection('users').doc(userId).update({
      'membership.planId': planId,
      'membership.planName': plan?.name || 'Unknown Plan',
      'membership.status': 'active',
      'membership.startDate': now,
      'membership.expirationDate': expirationDate,
      'membership.updatedAt': now,
      'membership.paymentReference': paymentData.reference
    });
    
    console.log(`User subscription updated: ${userId} to plan ${planId}`);
    
  } catch (error) {
    console.error('Error updating user subscription:', error);
  }
}
