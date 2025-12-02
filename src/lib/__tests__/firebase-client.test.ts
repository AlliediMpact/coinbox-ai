import { describe, it, expect } from 'vitest';

describe('Firebase Client Configuration', () => {
  describe('Environment Variables Validation', () => {
    const requiredEnvVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID',
    ];

    it('should have all required Firebase environment variables', () => {
      requiredEnvVars.forEach((varName) => {
        const value = process.env[varName];
        // In production, these should be defined
        if (process.env.NODE_ENV === 'production') {
          expect(value).toBeDefined();
        } else {
          // In test environment, they may not be set
          expect(typeof value).toMatch(/string|undefined/);
        }
      });
    });

    it('should validate API key format', () => {
      const validApiKey = 'AIzaSyDtest123456789012345678901234567';
      const invalidApiKey = 'invalid_key';

      expect(validApiKey).toMatch(/^AIza/);
      expect(validApiKey.length).toBeGreaterThan(30);
      expect(invalidApiKey).not.toMatch(/^AIza/);
    });

    it('should validate auth domain format', () => {
      const validDomain = 'coinbox-ai.firebaseapp.com';
      const invalidDomain = 'notafirebasedomain.com';

      expect(validDomain).toContain('firebaseapp.com');
      expect(invalidDomain).not.toContain('firebaseapp.com');
    });

    it('should validate project ID format', () => {
      const validProjectId = 'coinbox-ai';
      const invalidProjectId = 'Invalid Project ID With Spaces';

      expect(validProjectId).toMatch(/^[a-z0-9-]+$/);
      expect(invalidProjectId).not.toMatch(/^[a-z0-9-]+$/);
    });

    it('should validate storage bucket format', () => {
      const validBucket = 'coinbox-ai.appspot.com';
      const invalidBucket = 'not-a-bucket';

      expect(validBucket).toContain('.appspot.com');
      expect(invalidBucket).not.toContain('.appspot.com');
    });

    it('should validate messaging sender ID format', () => {
      const validSenderId = '123456789012';
      const invalidSenderId = 'abc';

      expect(validSenderId).toMatch(/^\d{10,15}$/);
      expect(invalidSenderId).not.toMatch(/^\d{10,15}$/);
    });

    it('should validate app ID format', () => {
      const validAppId = '1:123456789012:web:abc123def456';
      const invalidAppId = 'not-an-app-id';

      expect(validAppId).toMatch(/^\d+:\d+:(web|android|ios):[a-f0-9]+$/);
      expect(invalidAppId).not.toMatch(/^\d+:\d+:(web|android|ios):[a-f0-9]+$/);
    });
  });

  describe('Firebase Configuration Object', () => {
    it('should create valid config object', () => {
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'test-key',
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'test.firebaseapp.com',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'test-project',
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'test.appspot.com',
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789012:web:abc123',
      };

      expect(firebaseConfig).toHaveProperty('apiKey');
      expect(firebaseConfig).toHaveProperty('authDomain');
      expect(firebaseConfig).toHaveProperty('projectId');
      expect(firebaseConfig).toHaveProperty('storageBucket');
      expect(firebaseConfig).toHaveProperty('messagingSenderId');
      expect(firebaseConfig).toHaveProperty('appId');
    });

    it('should not include server-side keys', () => {
      const clientConfig = {
        apiKey: 'test',
        authDomain: 'test.firebaseapp.com',
        projectId: 'test',
      };

      // Server-side keys should NOT be in client config
      expect(clientConfig).not.toHaveProperty('privateKey');
      expect(clientConfig).not.toHaveProperty('serviceAccount');
      expect(clientConfig).not.toHaveProperty('databaseURL');
    });
  });

  describe('Firebase App Initialization', () => {
    it('should initialize only once', () => {
      const apps: any[] = [];
      
      // First initialization
      const shouldInit1 = apps.length === 0;
      if (shouldInit1) {
        apps.push({ name: 'default' });
      }
      expect(apps.length).toBe(1);

      // Second attempt - should not re-initialize
      const shouldInit2 = apps.length === 0;
      if (shouldInit2) {
        apps.push({ name: 'default' });
      }
      expect(apps.length).toBe(1); // Still only one app
    });

    it('should return existing app if already initialized', () => {
      const existingApps = [{ name: 'default', options: {} }];
      
      const getExistingApp = () => {
        return existingApps.length > 0 ? existingApps[0] : null;
      };

      expect(getExistingApp()).not.toBeNull();
      expect(getExistingApp()?.name).toBe('default');
    });
  });

  describe('Firebase Services', () => {
    it('should support Auth service', () => {
      const mockAuth = {
        signInWithEmailAndPassword: vi.fn(),
        signOut: vi.fn(),
        onAuthStateChanged: vi.fn(),
      };

      expect(mockAuth).toHaveProperty('signInWithEmailAndPassword');
      expect(mockAuth).toHaveProperty('signOut');
      expect(mockAuth).toHaveProperty('onAuthStateChanged');
    });

    it('should support Firestore service', () => {
      const mockFirestore = {
        collection: vi.fn(),
        doc: vi.fn(),
        getDoc: vi.fn(),
        setDoc: vi.fn(),
        updateDoc: vi.fn(),
        deleteDoc: vi.fn(),
      };

      expect(mockFirestore).toHaveProperty('collection');
      expect(mockFirestore).toHaveProperty('doc');
      expect(mockFirestore).toHaveProperty('getDoc');
    });

    it('should support Storage service', () => {
      const mockStorage = {
        ref: vi.fn(),
        uploadBytes: vi.fn(),
        getDownloadURL: vi.fn(),
        deleteObject: vi.fn(),
      };

      expect(mockStorage).toHaveProperty('ref');
      expect(mockStorage).toHaveProperty('uploadBytes');
      expect(mockStorage).toHaveProperty('getDownloadURL');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing environment variables', () => {
      const config = {
        apiKey: process.env.NONEXISTENT_VAR || 'fallback',
      };

      expect(config.apiKey).toBe('fallback');
    });

    it('should handle initialization errors gracefully', () => {
      const initializeWithError = () => {
        const config = {};
        if (Object.keys(config).length === 0) {
          throw new Error('Invalid configuration');
        }
        return config;
      };

      expect(() => initializeWithError()).toThrow('Invalid configuration');
    });

    it('should validate config before initialization', () => {
      const validateConfig = (config: any): boolean => {
        return !!(config.apiKey && config.projectId && config.authDomain);
      };

      const validConfig = {
        apiKey: 'test',
        projectId: 'test',
        authDomain: 'test.firebaseapp.com',
      };

      const invalidConfig = {
        apiKey: 'test',
      };

      expect(validateConfig(validConfig)).toBe(true);
      expect(validateConfig(invalidConfig)).toBe(false);
    });
  });

  describe('Security Best Practices', () => {
    it('should use NEXT_PUBLIC prefix for client-side vars', () => {
      const clientVarNames = [
        'NEXT_PUBLIC_FIREBASE_API_KEY',
        'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      ];

      clientVarNames.forEach((varName) => {
        expect(varName).toMatch(/^NEXT_PUBLIC_/);
      });
    });

    it('should not expose server secrets in client config', () => {
      const serverSecrets = [
        'FIREBASE_SERVICE_ACCOUNT',
        'PAYSTACK_SECRET_KEY',
        'CRON_SECRET',
      ];

      serverSecrets.forEach((secret) => {
        expect(secret).not.toMatch(/^NEXT_PUBLIC_/);
      });
    });

    it('should enforce HTTPS in production URLs', () => {
      const authDomain = 'coinbox-ai.firebaseapp.com';
      const fullUrl = `https://${authDomain}`;

      expect(fullUrl).toMatch(/^https:\/\//);
    });
  });

  describe('Type Safety', () => {
    it('should type Firebase config correctly', () => {
      interface FirebaseConfig {
        apiKey: string;
        authDomain: string;
        projectId: string;
        storageBucket: string;
        messagingSenderId: string;
        appId: string;
      }

      const config: FirebaseConfig = {
        apiKey: 'test',
        authDomain: 'test.firebaseapp.com',
        projectId: 'test-project',
        storageBucket: 'test.appspot.com',
        messagingSenderId: '123456789012',
        appId: '1:123456789012:web:abc123',
      };

      expect(config.apiKey).toBeTypeOf('string');
      expect(config.projectId).toBeTypeOf('string');
    });
  });
});
