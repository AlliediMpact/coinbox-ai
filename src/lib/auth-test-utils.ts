import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from './firebase';
import { mfaService } from './mfa-service';
import { authLogger } from './auth-logger';

// This is a utility to test different authentication scenarios
// NOTE: This is meant for development and testing only. Do not use in production code.

/**
 * Test a standard login flow
 */
export async function testStandardLogin(email: string, password: string): Promise<string> {
  const auth = getAuth(app);
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return `Login successful for ${userCredential.user.email}`;
  } catch (error: any) {
    return `Login failed: ${error.message}`;
  }
}

/**
 * Test rate limiting by making multiple auth requests
 */
export async function testRateLimiting(email: string, password: string, attempts: number = 5): Promise<string[]> {
  const auth = getAuth(app);
  const results: string[] = [];
  
  // Use incorrect password for testing rate limiting
  const wrongPassword = password + '123';
  
  for (let i = 0; i < attempts; i++) {
    try {
      await signInWithEmailAndPassword(auth, email, wrongPassword);
      results.push(`Attempt ${i + 1}: Login succeeded (unexpected)`);
    } catch (error: any) {
      results.push(`Attempt ${i + 1}: ${error.message}`);
      
      // If we hit rate limiting, stop making requests
      if (error.message.includes('too many requests') || error.message.includes('Too many unsuccessful login attempts')) {
        results.push('Rate limiting detected. Stopping test.');
        break;
      }
      
      // Add a small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return results;
}

/**
 * Test authentication logging
 */
export async function testAuthLogging(email: string, action: string): Promise<string> {
  try {
    // Log a test event
    await authLogger.logEvent(
      action as any,
      null,
      { email, testMode: true }
    );
    
    return 'Log event sent successfully';
  } catch (error: any) {
    return `Logging failed: ${error.message}`;
  }
}

/**
 * Utility to check if MFA is enabled for the current user
 */
export async function checkMfaStatus(): Promise<string> {
  const auth = getAuth(app);
  const user = auth.currentUser;
  
  if (!user) {
    return 'No user is currently signed in';
  }
  
  try {
    const enrolledFactors = await mfaService.listEnrolledFactors();
    
    if (enrolledFactors.length === 0) {
      return 'MFA is not enabled for this user';
    }
    
    const factorInfo = enrolledFactors.map(factor => {
      return {
        uid: factor.uid,
        displayName: factor.displayName,
        enrollmentTime: factor.enrollmentTime,
        factorId: factor.factorId
      };
    });
    
    return `MFA is enabled with ${enrolledFactors.length} factor(s): ${JSON.stringify(factorInfo)}`;
  } catch (error: any) {
    return `Error checking MFA status: ${error.message}`;
  }
}
