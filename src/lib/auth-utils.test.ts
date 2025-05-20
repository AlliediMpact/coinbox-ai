import { hasAdminAccess, getUserRole } from './auth-utils';
import * as firebaseAdmin from './firebase-admin';

// Mock Firebase Admin SDK
jest.mock('./firebase-admin', () => {
  const mockGet = jest.fn();
  const mockDoc = jest.fn().mockReturnValue({ get: mockGet });
  const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc });
  
  return {
    adminAuth: {
      getUser: jest.fn(),
    },
    adminDb: {
      collection: mockCollection,
    },
  };
});

// Since TypeScript can't infer the mocked types, we need to cast
const mockAdminAuth = firebaseAdmin.adminAuth as jest.Mocked<any>;
const mockAdminDb = firebaseAdmin.adminDb as jest.Mocked<any>;

describe('Auth Utils', () => {
  // Set up typed mocks that can be configured in each test
  let mockGet: jest.Mock;
  let mockDoc: jest.Mock;
  let mockCollection: jest.Mock;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get references to the mocks
    mockGet = jest.fn();
    mockDoc = jest.fn().mockReturnValue({ get: mockGet });
    mockCollection = jest.fn().mockReturnValue({ doc: mockDoc });
    
    // Re-configure mocks for each test
    if (mockAdminDb) {
      mockAdminDb.collection = mockCollection;
    }
  });

  describe('hasAdminAccess', () => {
    it('should return true for admin user with custom claims', async () => {
      // Mock admin user with custom claims
      mockAdminAuth.getUser = jest.fn().mockResolvedValue({
        uid: 'admin-user',
        customClaims: { role: 'admin' },
      });

      const result = await hasAdminAccess('admin-user');
      expect(result).toBe(true);
      expect(mockAdminAuth.getUser).toHaveBeenCalledWith('admin-user');
    });

    it('should return true for support user with custom claims when full access is not required', async () => {
      // Mock support user with custom claims
      mockAdminAuth.getUser = jest.fn().mockResolvedValue({
        uid: 'support-user',
        customClaims: { role: 'support' },
      });

      const result = await hasAdminAccess('support-user', false);
      expect(result).toBe(true);
      expect(mockAdminAuth.getUser).toHaveBeenCalledWith('support-user');
    });

    it('should return false for support user with custom claims when full access is required', async () => {
      // Mock support user with custom claims
      mockAdminAuth.getUser = jest.fn().mockResolvedValue({
        uid: 'support-user',
        customClaims: { role: 'support' },
      });

      const result = await hasAdminAccess('support-user', true);
      expect(result).toBe(false);
      expect(mockAdminAuth.getUser).toHaveBeenCalledWith('support-user');
    });

    it('should check Firestore if custom claims are not available', async () => {
      // Mock user without custom claims
      mockAdminAuth.getUser = jest.fn().mockResolvedValue({
        uid: 'firestore-admin-user',
        customClaims: null,
      });

      // Mock Firestore response
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ role: 'admin' }),
      });

      const result = await hasAdminAccess('firestore-admin-user');
      expect(result).toBe(true);
      expect(mockAdminAuth.getUser).toHaveBeenCalledWith('firestore-admin-user');
      expect(mockDoc).toHaveBeenCalledWith('firestore-admin-user');
      expect(mockCollection).toHaveBeenCalledWith('users');
    });

    it('should handle user not found in Auth but exists in Firestore', async () => {
      // Mock Auth user not found error
      mockAdminAuth.getUser = jest.fn().mockRejectedValue({
        code: 'auth/user-not-found',
      });

      // Mock Firestore response
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ role: 'admin' }),
      });

      const result = await hasAdminAccess('firestore-only-user');
      expect(result).toBe(true);
      expect(mockAdminAuth.getUser).toHaveBeenCalledWith('firestore-only-user');
      expect(mockDoc).toHaveBeenCalledWith('firestore-only-user');
      expect(mockCollection).toHaveBeenCalledWith('users');
    });

    it('should return false if user has no role in custom claims or Firestore', async () => {
      // Mock user without role
      mockAdminAuth.getUser = jest.fn().mockResolvedValue({
        uid: 'regular-user',
        customClaims: null,
      });

      // Mock Firestore response
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ name: 'Regular User' }), // No role field
      });

      const result = await hasAdminAccess('regular-user');
      expect(result).toBe(false);
      expect(mockAdminAuth.getUser).toHaveBeenCalledWith('regular-user');
      expect(mockDoc).toHaveBeenCalledWith('regular-user');
      expect(mockCollection).toHaveBeenCalledWith('users');
    });
  });

  describe('getUserRole', () => {
    it('should return role from custom claims if available', async () => {
      // Mock admin user with custom claims
      mockAdminAuth.getUser = jest.fn().mockResolvedValue({
        uid: 'admin-user',
        customClaims: { role: 'admin' },
      });

      const result = await getUserRole('admin-user');
      expect(result).toBe('admin');
      expect(mockAdminAuth.getUser).toHaveBeenCalledWith('admin-user');
    });

    it('should check Firestore if custom claims are not available', async () => {
      // Mock user without custom claims
      mockAdminAuth.getUser = jest.fn().mockResolvedValue({
        uid: 'firestore-support-user',
        customClaims: null,
      });

      // Mock Firestore response
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ role: 'support' }),
      });

      const result = await getUserRole('firestore-support-user');
      expect(result).toBe('support');
      expect(mockAdminAuth.getUser).toHaveBeenCalledWith('firestore-support-user');
      expect(mockDoc).toHaveBeenCalledWith('firestore-support-user');
      expect(mockCollection).toHaveBeenCalledWith('users');
    });

    it('should return "user" as default role', async () => {
      // Mock user without role
      mockAdminAuth.getUser = jest.fn().mockResolvedValue({
        uid: 'regular-user',
        customClaims: null,
      });

      // Mock Firestore response
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ name: 'Regular User' }), // No role field
      });

      const result = await getUserRole('regular-user');
      expect(result).toBe('user');
      expect(mockAdminAuth.getUser).toHaveBeenCalledWith('regular-user');
      expect(mockDoc).toHaveBeenCalledWith('regular-user');
      expect(mockCollection).toHaveBeenCalledWith('users');
    });
  });
});
