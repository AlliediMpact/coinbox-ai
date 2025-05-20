import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { serverAuthLogger, AuthEventType } from '@/lib/auth-logger';
import { auth } from '@/lib/firebase-admin';

/**
 * API endpoint for logging authentication events
 * This will be called from the client side
 */
export async function POST(request: Request) {
  try {
    // Get session to verify the user is authenticated
    const sessionCookie = request.headers.get('cookie')?.split(';')
      .find(c => c.trim().startsWith('session='))?.split('=')[1];
    
    let userId = null;
    let isAuthenticated = false;
    
    // Verify the session if present
    if (sessionCookie) {
      try {
        const decodedToken = await auth.verifySessionCookie(sessionCookie);
        userId = decodedToken.uid;
        isAuthenticated = true;
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
    // and it's not an admin, reject the request
    if (isAuthenticated && logData.userId && logData.userId !== userId) {
      // TODO: Check if user is admin before rejecting
      return NextResponse.json({ error: 'User ID mismatch' }, { status: 403 });
    }
    
    // Get client IP address from request headers
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 'unknown';
    
    // Add server-determined fields to prevent client spoofing
    const enhancedLogData = {
      ...logData,
      ipAddress,
      timestamp: new Date(),
      // Override userId with the authenticated one if available
      userId: isAuthenticated ? userId : logData.userId
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
