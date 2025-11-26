import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { serverAuthLogger } from '@/lib/server-auth-logger';
import { AuthEventType } from '@/lib/auth-logger';
import { hasAdminAccess } from '@/lib/auth-utils';

/**
 * API endpoint for logging authentication events
 * This will be called from the client side
 */
export async function POST(request: Request) {
  try {
    if (!adminAuth || !adminDb) {
      console.error('Firebase Admin SDK not initialized');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    // Get session to verify the user is authenticated
    const sessionCookie = request.headers.get('cookie')?.split(';')
      .find(c => c.trim().startsWith('session='))?.split('=')[1];
    
    let userId = null;
    let isAuthenticated = false;
    let isAdmin = false;
    let isSupport = false;
    
    // Verify the session if present
    if (sessionCookie) {
      try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
        userId = decodedToken.uid;
        isAuthenticated = true;
        
        // Check if user has admin or support role
        if (userId) {
          isAdmin = await hasAdminAccess(userId, true); // true = admin only
          isSupport = !isAdmin && await hasAdminAccess(userId); // support role check
        }
      } catch (error) {
        console.error('Invalid session cookie', error);
      }
    }
    
    // Parse the log data
    const logData = await request.json();
    
    // Security check: Only allow logging for the authenticated user
    // or for certain event types that make sense for unauthenticated users
    const allowedUnauthenticatedEvents = [
      AuthEventType.SIGN_IN_FAILURE,
      AuthEventType.SIGN_IN_SUCCESS,
      AuthEventType.ACCOUNT_CREATED,
      AuthEventType.PASSWORD_RESET_REQUEST,
      AuthEventType.AUTH_ERROR
    ];
    
    if (!isAuthenticated && !allowedUnauthenticatedEvents.includes(logData.eventType as AuthEventType)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // If the client provides a userId but it doesn't match the authenticated user,
    // only allow if user is admin or support
    if (isAuthenticated && logData.userId && logData.userId !== userId) {
      if (!(isAdmin || isSupport)) {
        return NextResponse.json({ error: 'User ID mismatch - insufficient permissions' }, { status: 403 });
      }
    }
    
    // Get client IP address from request headers
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 'unknown';
    
    // Add server-determined fields to prevent client spoofing
    const enhancedLogData = {
      ...logData,
      ipAddress,
      timestamp: new Date(),
      // Override userId with the authenticated one if available, unless admin/support is logging for another user
      userId: (isAuthenticated && (!logData.userId || (!isAdmin && !isSupport))) ? userId : logData.userId,
      // Add admin tracking field if applicable
      loggedBy: (isAdmin || isSupport) && logData.userId !== userId ? userId : undefined
    };
    
    // Log the event
    await adminDb.collection('authLogs').add(enhancedLogData);
    
    // For security events, log to the security events collection as well
    const isSecurityEvent = [
      AuthEventType.SIGN_IN_FAILURE,
      AuthEventType.PASSWORD_RESET_REQUEST,
      AuthEventType.AUTH_ERROR
    ].includes(logData.eventType as AuthEventType);
    
    if (isSecurityEvent) {
      await serverAuthLogger.logEvent(
        logData.eventType as AuthEventType,
        enhancedLogData.userId,
        logData.metadata || {},
        request
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging auth event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
