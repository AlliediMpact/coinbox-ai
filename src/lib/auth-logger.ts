'use client';

import { adminDb } from '@/lib/firebase-admin';
import { auth as clientAuth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

/**
 * Event types for auth logging
 */
export enum AuthEventType {
  SIGN_IN_SUCCESS = 'sign_in_success',
  SIGN_IN_FAILURE = 'sign_in_failure',
  SIGN_OUT = 'sign_out',
  PASSWORD_RESET_REQUEST = 'password_reset_request',
  PASSWORD_RESET_COMPLETE = 'password_reset_complete',
  EMAIL_VERIFICATION_SENT = 'email_verification_sent',
  EMAIL_VERIFIED = 'email_verified',
  ACCOUNT_CREATED = 'account_created',
  ACCOUNT_DELETED = 'account_deleted',
  PASSWORD_CHANGED = 'password_changed',
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',
  MFA_VERIFICATION_SUCCESS = 'mfa_verification_success',
  MFA_VERIFICATION_FAILURE = 'mfa_verification_failure',
  AUTH_TOKEN_REFRESH = 'auth_token_refresh',
  AUTH_ERROR = 'auth_error',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked'
}

/**
 * Service for logging authentication events
 */
export const authLogger = {
  // Event subscribers
  _subscribers: [] as ((event: any) => void)[],

  /**
   * Subscribe to auth events
   * @param callback Function to be called when events occur
   * @returns Unsubscribe function
   */
  subscribeToEvents(callback: (event: any) => void) {
    this._subscribers.push(callback);
    return () => {
      this._subscribers = this._subscribers.filter(sub => sub !== callback);
    };
  },

  /**
   * Notify all subscribers about an event
   * @param eventData The event data
   */
  _notifySubscribers(eventData: any) {
    this._subscribers.forEach(callback => {
      try {
        callback(eventData);
      } catch (error) {
        console.error('Error in auth event subscriber:', error);
      }
    });
  },

  /**
   * Log an authentication event
   */
  async logEvent(
    eventType: AuthEventType, 
    userId: string | null,
    metadata: Record<string, any> = {},
    isServer = false
  ) {
    try {
      const timestamp = new Date();
      const clientInfo = !isServer ? this.getClientInfo() : { userAgent: 'Server' };
      
      const logData = {
        eventType,
        userId,
        timestamp,
        ...clientInfo,
        ...metadata
      };
      
      // Notify subscribers
      this._notifySubscribers(logData);
      
      // If we're on the server and have the admin SDK
      if (isServer && adminDb) {
        await adminDb.collection('authLogs').add(logData);
        return;
      }
      
      // If we're on the client, call the logging API
      await fetch('/api/auth/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logData)
      });
      
    } catch (error) {
      console.error('Error logging auth event:', error);
      // Don't throw, logging should never break the app
    }
  },
  
  /**
   * Get client information for logging
   */
  getClientInfo() {
    if (typeof window === 'undefined') {
      return { 
        userAgent: 'Server',
        ipAddress: null,
        screenSize: null
      };
    }
    
    return {
      userAgent: navigator.userAgent,
      screenSize: {
        width: window.screen.width,
        height: window.screen.height
      },
      language: navigator.language,
      platform: navigator.platform,
      // IP will be captured on the server side
    };
  },
  
  /**
   * Setup listener for auth state changes to automatically log events
   */
  setupAuthStateListener() {
    if (typeof window === 'undefined' || !clientAuth) return;
    
    return onAuthStateChanged(clientAuth, (user) => {
      if (user) {
        // User just signed in
        this.logEvent(
          AuthEventType.SIGN_IN_SUCCESS,
          user.uid,
          {
            email: user.email,
            emailVerified: user.emailVerified,
            providerId: user.providerData[0]?.providerId || 'unknown'
          }
        );
      }
    });
  }
};

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
