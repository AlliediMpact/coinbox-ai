// src/app/api/auth/create-pending-user/route.ts
import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin'; // Correct import names
import { FieldValue } from 'firebase-admin/firestore'; // Import FieldValue
import { getServerSession, Session } from 'next-auth';
import { hasAdminAccess } from '@/lib/auth-utils';

// NOTE: MEMBERSHIP_TIERS should ideally be fetched from a central config or DB
const MEMBERSHIP_TIERS_CONFIG = {
  Basic: { securityFee: 1000 },
  Ambassador: { securityFee: 2000 },
  VIP: { securityFee: 3000 },
  Business: { securityFee: 4000 },
};

export async function POST(request: Request) {
  try {
    if (!adminDb || !adminAuth) {
      console.error('Firebase Admin SDK not initialized');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    const { fullName, email, phone, referralCode, membershipTier, isAdminCreated } = await request.json();

    // Basic input validation (server-side)
    if (!fullName || !email || !phone || !membershipTier) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Email format validation (basic server-side check)
    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Membership tier validation
    if (!MEMBERSHIP_TIERS_CONFIG[membershipTier as keyof typeof MEMBERSHIP_TIERS_CONFIG]) {
      return NextResponse.json({ error: 'Invalid membership tier selected' }, { status: 400 });
    }
    
    // For tracking admin creation
    let currentUserId: string | undefined = undefined;
    let session: Session | null = null;
    
    // Check if this is an admin-created user
    if (isAdminCreated) {
      // Verify the user is admin or support
      session = await getServerSession();

      if (session?.user && (session.user as any).id) {
        currentUserId = (session.user as any).id;
      } else if (session?.user && (session.user as any).sub) {
        currentUserId = (session.user as any).sub;
      }

      if (!currentUserId) {
        return NextResponse.json({ error: 'Unauthorized: User not logged in.' }, { status: 401 });
      }

      // If creating a user as admin, require admin access (support can't create users)
      if (!(await hasAdminAccess(currentUserId, true))) {
        return NextResponse.json({ error: 'Unauthorized: Admin role required to create users.' }, { status: 403 });
      }
    }

    // Check if email already exists in Firebase Auth *before* creating pending user
    try {
      await adminAuth.getUserByEmail(email);
      // If no error, user exists
      return NextResponse.json({ error: 'The email address is already in use by another account.' }, { status: 400 });
    } catch (error: any) {
      // Expected error if user does NOT exist, proceed
      if (error.code !== 'auth/user-not-found') {
        console.error('Error checking for existing user before creating pending:', error);
        // Re-throw other unexpected errors
        throw error; // Let the catch block handle this unexpected error
      }
    }

    // Create a temporary document in a "pending_signups" collection
    // Use Firestore to generate a unique ID for the pending signup
    const pendingSignupsRef = adminDb.collection('pending_signups');
    const newPendingDocRef = pendingSignupsRef.doc(); // Auto-generate ID
    const temporaryId = newPendingDocRef.id;

    const pendingUserData = {
      fullName,
      email,
      phone,
      referralCode: referralCode || "",
      membershipTier,
      createdAt: FieldValue.serverTimestamp(), // Use server timestamp
      // Consider adding an expiry time for temporary data cleanup
      expiresAt: Date.now() + (15 * 60 * 1000), // e.g., expires in 15 minutes
      createdBy: currentUserId || null, // Track who created this if admin
    };

    await newPendingDocRef.set(pendingUserData);

    // Return the temporary ID and the expected payment amount to the client
    const expectedAmountKobo = MEMBERSHIP_TIERS_CONFIG[membershipTier as keyof typeof MEMBERSHIP_TIERS_CONFIG].securityFee * 100;

    return NextResponse.json({ temporaryId, expectedAmountKobo, message: 'Pending user created successfully.' }, { status: 201 });

  } catch (error: any) {
    console.error('Create Pending User API error:', error);

    // Handle specific Firebase Admin or other errors
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'The email address is already in use by another account.' }, { status: 400 });
    }
    if (error.code === 'auth/invalid-email') {
      return NextResponse.json({ error: 'The email address is not valid.' }, { status: 400 });
    }
    if (error.code) { // Catch other Firebase Admin errors
      return NextResponse.json({ error: `Server error: ${error.code}` }, { status: 500 });
    }

    return NextResponse.json({ error: error.message || 'An unexpected error occurred while creating pending user.' }, { status: 500 });
  }
}
