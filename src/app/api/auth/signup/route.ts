// src/app/api/auth/signup/route.ts
import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin'; // Assuming firebase-admin is set up here
// import { getMembershipTier } from '@/lib/membership-tiers'; // Not needed here anymore
import { Timestamp } from 'firebase-admin/firestore'; // Import Timestamp for expiry check

// Define password requirements on the server-side
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
};

// Server-side password validation function
const validatePasswordServer = (password: string): { isValid: boolean; error?: string } => {
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    return { isValid: false, error: `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long` };
  }
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }
  if (PASSWORD_REQUIREMENTS.requireNumber && !/\d/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }
  if (PASSWORD_REQUIREMENTS.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one special character' };
  }
  return { isValid: true };
};

// NOTE: MEMBERSHIP_TIERS_CONFIG is needed here for server-side payment validation
// It should be kept in sync with any client-side representation or fetched from a central config.
const MEMBERSHIP_TIERS_CONFIG = {
  Basic: { securityFee: 1000, refundable: 800, adminFee: 200, loanLimit: 500, investmentLimit: 10000, commission: 0.05 },
  Ambassador: { securityFee: 2000, refundable: 1500, adminFee: 500, loanLimit: 2000, investmentLimit: 50000, commission: 0.1 },
  VIP: { securityFee: 3000, refundable: 2000, adminFee: 1000, loanLimit: 5000, investmentLimit: 100000, commission: 0.15 },
  Business: { securityFee: 4000, refundable: 3000, adminFee: 1000, loanLimit: 10000, investmentLimit: 500000, commission: 0.2 },
};


// Server-side payment validation function
async function validatePaymentServer(reference: string, expectedAmountKobo: number): Promise<{ success: boolean; error?: string }> {
    if (!process.env.PAYSTACK_SECRET_KEY) {
        console.error('PAYSTACK_SECRET_KEY is not set.');
        return { success: false, error: 'Server configuration error: Paystack secret key missing.' };
    }

    console.log(`Validating payment reference: ${reference} (Server-side)`);

    try {
        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
            }
        });

        const data = await response.json();

        if (!response.ok || !data.status) {
            console.error('Paystack verification failed:', data);
            return { success: false, error: data.message || 'Payment verification failed with Paystack.' };
        }

        // Check if the transaction was successful
        if (data.data.status !== 'success') {
            console.warn(`Paystack transaction status is not success: ${data.data.status}`);
             return { success: false, error: `Payment transaction status is "${data.data.status}".` };
        }

        // Check if the amount paid matches the expected amount
         // Paystack amounts are in the minor unit (kobo/cents)
        if (data.data.amount !== expectedAmountKobo) {
             console.warn(`Payment amount mismatch. Expected: ${expectedAmountKobo}, Received: ${data.data.amount}`);
             return { success: false, error: 'Payment amount mismatch.' };
        }


        console.log('Payment validation successful:', data.data);
        return { success: true };

    } catch (error: any) {
        console.error('Server-side payment validation error:', error);
        return { success: false, error: `Server error during payment validation: ${error.message || 'Unknown error'}` };
    }
}


export async function POST(request: Request) {
  try {
    // Expecting temporaryId, password, and paymentReference from the client
    const { temporaryId, password, paymentReference } = await request.json();

    // Validate required fields from the request body
    if (!temporaryId || !password || !paymentReference) {
      return NextResponse.json({ error: 'Missing required fields in request body.' }, { status: 400 });
    }

    // 1. Fetch the pending user data using the temporaryId
    const pendingUserDoc = await db.collection('pending_signups').doc(temporaryId).get();

    if (!pendingUserDoc.exists) {
      return NextResponse.json({ error: 'Invalid or expired registration attempt. Please start again.' }, { status: 400 });
    }

    const pendingUserData = pendingUserDoc.data();

    // Validate that the pending data is not expired (optional, but good practice)
    // Ensure expiresAt exists and is a valid timestamp/number
    if (pendingUserData?.expiresAt && pendingUserData.expiresAt < Date.now()) {
         // Clean up expired document (optional, could be done by a separate cleanup job)
         // await db.collection('pending_signups').doc(temporaryId).delete();
         return NextResponse.json({ error: 'Registration attempt expired. Please start again.' }, { status: 400 });
    }


    // Extract user data from the pending document
    const { fullName, email, phone, referralCode, membershipTier } = pendingUserData as any; // Cast to any for now, define interfaces later

    // Re-validate essential data from the fetched document (defense in depth)
     if (!fullName || !email || !phone || !membershipTier) {
         console.error(`Incomplete pending user data for ID ${temporaryId}`);
          // Clean up potentially corrupt document
         // await db.collection('pending_signups').doc(temporaryId).delete();
         return NextResponse.json({ error: 'Incomplete registration data. Please start again.' }, { status: 500 });
     }


    // Password validation (using the provided password)
    const passwordValidation = validatePasswordServer(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json({ error: passwordValidation.error }, { status: 400 });
    }

    // Membership tier validation and get expected amount
     const tierConfig = MEMBERSHIP_TIERS_CONFIG[membershipTier as keyof typeof MEMBERSHIP_TIERS_CONFIG];
     if (!tierConfig) {
         // This should ideally not happen if validation passed in create-pending-user, but check anyway
         console.error(`Invalid membership tier in pending data for ID ${temporaryId}: ${membershipTier}`);
          // Clean up potentially corrupt document
         // await db.collection('pending_signups').doc(temporaryId).delete();
         return NextResponse.json({ error: 'Invalid membership tier in registration data.' }, { status: 500 });
     }
    const expectedAmountKobo = tierConfig.securityFee * 100; // Convert R to kobo/cents


    // **Crucial Step: Implement server-side payment reference validation**
    const paymentValidationResult = await validatePaymentServer(paymentReference, expectedAmountKobo);
    if (!paymentValidationResult.success) {
         // Return the specific payment validation error
        return NextResponse.json({ error: paymentValidationResult.error || 'Payment validation failed.' }, { status: 400 });
    }


    // Check if user already exists (less likely now with create-pending-user check, but still defensive)
    try {
        await auth.getUserByEmail(email);
        // If no error, user exists - clean up pending doc and return error
        console.warn(`Attempted to complete registration for existing email: ${email} (Pending ID: ${temporaryId})`);
        await db.collection('pending_signups').doc(temporaryId).delete(); // Clean up
        return NextResponse.json({ error: 'The email address is already in use by another account.' }, { status: 400 });
    } catch (error: any) {
        // Expected error if user does NOT exist, proceed with creation
        if (error.code !== 'auth/user-not-found') {
             console.error('Error checking for existing user during signup completion:', error);
             // Re-throw other unexpected errors
             throw error;
        }
    }


    // 2. Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: fullName,
      // emailVerified: false // User will verify via email link
    });

    const userUid = userRecord.uid;


    // 3. Create user document in Firestore
    await db.collection("users").doc(userUid).set({
      fullName,
      email: userRecord.email,
      phone: phone,
      membershipTier: membershipTier,
      membershipDetails: {
        securityFee: tierConfig.securityFee,
        refundableAmount: tierConfig.refundable,
        adminFee: tierConfig.adminFee,
        loanLimit: tierConfig.loanLimit,
        investmentLimit: tierConfig.investmentLimit,
        commission: tierConfig.commission
      },
      referralCode: referralCode || "",
      emailVerified: userRecord.emailVerified, // Should be false initially
      kycStatus: 'none',
      createdAt: new Date(),
      lastLoginAt: new Date(), // Or null initially
      paymentReference: paymentReference // Store the validated payment reference
    });

    // 4. Initialize wallet with locked security deposit
    await db.collection("wallets").doc(userUid).set({
      availableBalance: 0,
      lockedBalance: tierConfig.refundable,
      totalBalance: tierConfig.refundable,
      lastUpdated: new Date()
    });

    // 5. Send email verification - Generate link server-side
    const actionCodeSettings = {
      url: `${process.env.NEXT_PUBLIC_VERIFICATION_REDIRECT_URL || process.env.NEXT_PUBLIC_BASE_URL}/auth/verify-email`,
      handleCodeInApp: true,
      dynamicLinkDomain: process.env.NEXT_PUBLIC_FIREBASE_DYNAMIC_LINKS_DOMAIN // Make sure this is configured
    };
    const verificationLink = await auth.generateEmailVerificationLink(email, actionCodeSettings);

    console.log(`Generated email verification link for ${email}: ${verificationLink}`);
    
    // Send verification email using our email service
    try {
      const { emailService } = await import('@/lib/email-service');
      await emailService.sendVerificationEmail(email, fullName, verificationLink);
      console.log(`Verification email sent to ${email}`);
      
      // Also send payment confirmation
      await emailService.sendPaymentConfirmation(
        email, 
        fullName, 
        tierConfig.securityFee, 
        membershipTier, 
        paymentReference
      );
      console.log(`Payment confirmation email sent to ${email}`);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail the signup process if email sending fails
    }

    // 6. Clean up the pending user document after successful creation
    await db.collection('pending_signups').doc(temporaryId).delete();
     console.log(`Deleted pending signup document with ID: ${temporaryId}`);


    // Return success response
    return NextResponse.json({ message: 'User created successfully. Verification email link generated.', userId: userUid }, { status: 201 });

  } catch (error: any) {
    console.error('Signup API error:', error);

    // Handle specific Firebase Auth errors
    if (error.code === 'auth/email-already-exists') {
      // This case should be rare now due to the check before pending creation,
      // but handle defensively. Clean up pending doc if it exists.
      if (temporaryId) {
           db.collection('pending_signups').doc(temporaryId).delete().catch(console.error); // Clean up asynchronously
      }
      return NextResponse.json({ error: 'The email address is already in use by another account.' }, { status: 400 });
    }
    if (error.code === 'auth/invalid-password') {
         return NextResponse.json({ error: 'The password is not strong enough.' }, { status: 400 });
    }
     if (error.code === 'auth/invalid-email') {
         return NextResponse.json({ error: 'The email address is not valid.' }, { status: 400 });
     }
     // Catch other potential errors during Firebase operations (Firestore, etc.)
     if (error.code) {
        return NextResponse.json({ error: `Firebase error: ${error.code}` }, { status: 500 });
     }


    return NextResponse.json({ error: error.message || 'An unexpected error occurred during signup completion.' }, { status: 500 });
  }
}
