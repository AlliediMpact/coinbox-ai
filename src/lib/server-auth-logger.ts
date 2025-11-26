import { AuthEventType } from './auth-logger';
import { adminDb } from './firebase-admin';

/**
 * Server-side logging functions
 */
export const serverAuthLogger = {
  /**
   * Log a server-side authentication event
   */
  async logEvent(
    eventType: AuthEventType, 
    userId: string | null, 
    metadata: Record<string, any> = {},
    request?: Request
  ) {
    try {
      if (!adminDb) {
        console.error('Server auth logger: Firebase admin not initialized');
        return;
      }
      
      const timestamp = new Date();
      
      // Extract client info from request if available
      const clientInfo = request ? {
        userAgent: request.headers.get('user-agent') || 'unknown',
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 'unknown',
        referer: request.headers.get('referer')
      } : {
        userAgent: 'Server',
        ipAddress: null,
        referer: null
      };
      
      const logData = {
        eventType,
        userId,
        timestamp,
        ...clientInfo,
        ...metadata
      };
      
      await adminDb.collection('authLogs').add(logData);
      
      // For security-critical events, we might want a separate collection
      const isSecurityEvent = [
        AuthEventType.SIGN_IN_FAILURE,
        AuthEventType.PASSWORD_RESET_REQUEST,
        AuthEventType.ACCOUNT_LOCKED,
        AuthEventType.MFA_VERIFICATION_FAILURE,
        AuthEventType.AUTH_ERROR
      ].includes(eventType);
      
      if (isSecurityEvent) {
        await adminDb.collection('securityEvents').add({
          ...logData,
          reviewed: false,
          severity: this.calculateSeverity(eventType, metadata)
        });
      }
      
    } catch (error) {
      console.error('Error logging server auth event:', error);
      // Don't throw, logging should never break the app
    }
  },
  
  /**
   * Calculate security event severity
   */
  calculateSeverity(
    eventType: AuthEventType, 
    metadata: Record<string, any>
  ): 'low' | 'medium' | 'high' | 'critical' {
    switch (eventType) {
      case AuthEventType.SIGN_IN_FAILURE:
        return metadata.attemptCount > 5 ? 'high' : 'medium';
        
      case AuthEventType.ACCOUNT_LOCKED:
        return 'high';
        
      case AuthEventType.PASSWORD_RESET_REQUEST:
        return 'medium';
        
      case AuthEventType.MFA_VERIFICATION_FAILURE:
        return metadata.attemptCount > 3 ? 'high' : 'medium';
        
      case AuthEventType.AUTH_ERROR:
        return metadata.critical ? 'critical' : 'medium';
        
      default:
        return 'low';
    }
  }
};
