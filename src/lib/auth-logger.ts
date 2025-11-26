'use client';

import { AuthEventType } from './auth-events';

export { AuthEventType };

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
  }
};


