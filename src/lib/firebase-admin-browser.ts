/**
 * Browser-compatible version of Firebase Admin
 * 
 * This is a stub implementation for client-side code that attempts to import the
 * firebase-admin module. In a browser environment, we return null or mock implementations.
 */

// Export null implementations for browser environments
export const adminAuth = null;
export const adminDb = null;
export const adminStorage = null;

// Mock admin functions for browser
export const verifyIdToken = async () => {
  console.warn('Firebase Admin verifyIdToken called in browser environment');
  return null;
};

export const getUser = async () => {
  console.warn('Firebase Admin getUser called in browser environment');
  return null;
};

export const createUser = async () => {
  console.warn('Firebase Admin createUser called in browser environment');
  return null;
};

export const customAuthClaims = {
  setAdmin: async () => {
    console.warn('Firebase Admin setAdmin called in browser environment');
    return null;
  },
  setModerator: async () => {
    console.warn('Firebase Admin setModerator called in browser environment');
    return null;
  },
  removeClaims: async () => {
    console.warn('Firebase Admin removeClaims called in browser environment');
    return null;
  }
};

// Provide a way to check if we're in browser environment
export const isAdminInitialized = false;
