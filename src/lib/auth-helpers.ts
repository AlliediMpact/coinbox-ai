import { auth } from './firebase';
import { getAuth } from 'firebase-admin/auth';
import { headers } from 'next/headers';

/**
 * Authentication helpers for API routes
 */

/**
 * Verify if the user has admin role
 */
export async function verifyAdminRole(request: Request): Promise<any | null> {
  try {
    // Get the authorization header
    const headersList = headers();
    const authorization = headersList.get('authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return null;
    }

    const token = authorization.substring(7);
    
    // Verify the token with Firebase Admin
    const decodedToken = await getAuth().verifyIdToken(token);
    
    // Check if user has admin role in custom claims
    if (decodedToken.admin === true || decodedToken.role === 'admin') {
      return decodedToken;
    }

    return null;
  } catch (error) {
    console.error('Error verifying admin role:', error);
    return null;
  }
}

/**
 * Verify if the user has support role or higher
 */
export async function verifySupportRole(request: Request): Promise<any | null> {
  try {
    const headersList = headers();
    const authorization = headersList.get('authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return null;
    }

    const token = authorization.substring(7);
    const decodedToken = await getAuth().verifyIdToken(token);
    
    // Check if user has support or admin role
    if (decodedToken.admin === true || 
        decodedToken.role === 'admin' || 
        decodedToken.support === true || 
        decodedToken.role === 'support') {
      return decodedToken;
    }

    return null;
  } catch (error) {
    console.error('Error verifying support role:', error);
    return null;
  }
}

/**
 * Verify user authentication (any authenticated user)
 */
export async function verifyAuthentication(request: Request): Promise<any | null> {
  try {
    const headersList = headers();
    const authorization = headersList.get('authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return null;
    }

    const token = authorization.substring(7);
    const decodedToken = await getAuth().verifyIdToken(token);
    
    return decodedToken;
  } catch (error) {
    console.error('Error verifying authentication:', error);
    return null;
  }
}

/**
 * Extract user ID from request (for user-specific endpoints)
 */
export async function getUserIdFromRequest(request: Request): Promise<string | null> {
  const user = await verifyAuthentication(request);
  return user?.uid || null;
}

/**
 * Check if user owns the resource (for user-specific operations)
 */
export async function verifyResourceOwnership(request: Request, resourceUserId: string): Promise<boolean> {
  const user = await verifyAuthentication(request);
  if (!user) return false;
  
  // Admin can access any resource
  if (user.admin === true || user.role === 'admin') {
    return true;
  }
  
  // User can only access their own resources
  return user.uid === resourceUserId;
}
