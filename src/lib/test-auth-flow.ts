import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from "firebase/auth";

/**
 * This is a test script to validate the authentication flow.
 * It's meant to be run in the browser console or in development mode.
 * 
 * Usage:
 * 1. Import this file: import { testAuthFlow } from './test-auth-flow'
 * 2. Run the test: testAuthFlow('test@example.com', 'Password123!')
 */

export async function testAuthFlow(email: string, password: string) {
  console.log('🧪 Starting auth flow test');
  let testUser;
  
  try {
    // Step 1: Create a test user
    console.log(`1️⃣ Creating test user with email: ${email}`);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    testUser = userCredential.user;
    console.log('✅ User created successfully:', testUser.uid);
    
    // Step 2: Send verification email
    console.log('2️⃣ Sending verification email');
    await sendEmailVerification(testUser);
    console.log('✅ Verification email sent');
    
    // Step 3: Sign out the user
    console.log('3️⃣ Signing out test user');
    await signOut(auth);
    console.log('✅ User signed out');
    
    // Step 4: Attempt to sign in (should work but will need verification)
    console.log('4️⃣ Attempting to sign in');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      const currentUser = auth.currentUser;
      console.log('Current user after sign in:', currentUser);
      
      if (currentUser && !currentUser.emailVerified) {
        console.log('❗ Sign-in successful BUT email verification is required');
        console.log('👉 Check your email and verify the account');
      } else {
        console.log('✅ Sign-in successful with verified email');
      }
    } catch (signInError: any) {
      console.log('❌ Sign-in error:', signInError.message);
      console.log('👉 This may be expected if email verification is required');
    }
    
    // Step 5: Test password reset
    console.log('5️⃣ Testing password reset functionality');
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('✅ Password reset email sent');
    } catch (resetError: any) {
      console.error('❌ Password reset error:', resetError.message);
    }
    
    console.log('🏁 Auth flow test completed');
    console.log('📝 Next steps:');
    console.log('1. Check your email for the verification link');
    console.log('2. After verifying, try signing in again');
    console.log('3. Check your email for the password reset link');
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    
    // Try to clean up if user was created
    if (testUser) {
      console.log('🧹 Attempting to clean up test user');
      try {
        await testUser.delete();
        console.log('✅ Test user deleted');
      } catch (deleteError) {
        console.error('❌ Could not delete test user:', deleteError);
      }
    }
  }
}
