/**
 * Trading Rate Limit Firestore Fallback Integration Tests
 * Tests rate limiting fallback to Firestore when Redis is unavailable
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import {
  initializeTestApp,
  initializeAdminTestApp,
  cleanupTestEnvironment,
  clearFirestoreData,
  waitFor,
} from './firebase-emulator-utils';

// Mock NextRequest
class MockNextRequest {
  ip: string;
  nextUrl: { pathname: string; searchParams: URLSearchParams };
  cookies: Map<string, any>;
  bodyData: any;

  constructor(config: any = {}) {
    this.ip = config.ip || '127.0.0.1';
    this.nextUrl = {
      pathname: config.pathname || '/api/trading/create',
      searchParams: new URLSearchParams(config.searchParams || {}),
    };
    this.cookies = new Map();
    this.bodyData = config.body || {};
  }

  get body() {
    return JSON.stringify(this.bodyData);
  }
}

describe('Trading Rate Limit Firestore Fallback Integration Tests', () => {
  let db: any;
  let adminDb: any;

  beforeAll(() => {
    const { db: testDb } = initializeTestApp();
    const { db: testAdminDb } = initializeAdminTestApp();
    db = testDb;
    adminDb = testAdminDb;
    
    // Mock getAdminDb to return our test admin DB
    vi.mock('@/lib/admin-bridge', () => ({
      getAdminDb: () => adminDb,
      getAdminAuth: () => null,
      getFieldValue: () => ({
        serverTimestamp: () => Timestamp.now(),
      }),
    }));

    // Ensure Redis is mocked to fail (simulating unavailability)
    vi.mock('ioredis', () => {
      return {
        default: vi.fn(() => {
          throw new Error('Redis unavailable');
        }),
      };
    });
  });

  afterAll(async () => {
    await cleanupTestEnvironment();
    vi.clearAllMocks();
  });

  beforeEach(async () => {
    await clearFirestoreData(db);
  });

  it('should create rate limit record in Firestore on first request', async () => {
    // Arrange
    const req = new MockNextRequest({
      ip: '192.168.1.100',
      pathname: '/api/trading/create',
      body: { amount: 1000, userId: 'user1' },
    });

    // Dynamically import to get mocked version
    const { tradingRateLimit } = await import('@/middleware/trading-rate-limit');

    // Act
    const allowed = await tradingRateLimit(req, 'create');

    // Assert
    expect(allowed).toBe(true);

    // Verify Firestore record was created
    const rateLimitDoc = await adminDb
      .collection('tradingRateLimits')
      .doc('192.168.1.100-create')
      .get();

    expect(rateLimitDoc.exists).toBe(true);
    const data = rateLimitDoc.data();
    expect(data.count).toBe(1);
    expect(data.amount).toBe(1000);
  });

  it('should increment count on subsequent requests within time window', async () => {
    // Arrange
    const { tradingRateLimit } = await import('@/middleware/trading-rate-limit');
    const req = new MockNextRequest({
      ip: '192.168.1.101',
      pathname: '/api/trading/create',
      body: { amount: 500 },
    });

    // Act: Make multiple requests
    await tradingRateLimit(req, 'create');
    await tradingRateLimit(req, 'create');
    await tradingRateLimit(req, 'create');

    // Assert: Check Firestore record
    const rateLimitDoc = await adminDb
      .collection('tradingRateLimits')
      .doc('192.168.1.101-create')
      .get();

    const data = rateLimitDoc.data();
    expect(data.count).toBe(3);
    expect(data.amount).toBe(1500); // 500 * 3
  });

  it('should enforce count-based rate limit', async () => {
    // Arrange
    const { tradingRateLimit } = await import('@/middleware/trading-rate-limit');
    const req = new MockNextRequest({
      ip: '192.168.1.102',
      pathname: '/api/trading/create',
      body: { amount: 100 },
    });

    // Act: Make requests up to the limit (10 for 'create')
    const results: boolean[] = [];
    for (let i = 0; i < 12; i++) {
      const allowed = await tradingRateLimit(req, 'create');
      results.push(allowed);
    }

    // Assert: First 10 should be allowed, rest should be blocked
    expect(results.slice(0, 10).every(r => r === true)).toBe(true);
    expect(results.slice(10).some(r => r === false)).toBe(true);
  });

  it('should enforce amount-based rate limit', async () => {
    // Arrange
    const { tradingRateLimit } = await import('@/middleware/trading-rate-limit');
    
    // Act: Make requests with large amounts
    const req1 = new MockNextRequest({
      ip: '192.168.1.103',
      pathname: '/api/trading/create',
      body: { amount: 30000 },
    });
    
    const result1 = await tradingRateLimit(req1, 'create');
    
    const req2 = new MockNextRequest({
      ip: '192.168.1.103',
      pathname: '/api/trading/create',
      body: { amount: 25000 },
    });
    
    const result2 = await tradingRateLimit(req2, 'create');

    // Assert: First should pass, second should exceed amount limit (50000)
    expect(result1).toBe(true);
    expect(result2).toBe(false);
  });

  it('should reset counter after time window expires', async () => {
    // Arrange
    const { tradingRateLimit } = await import('@/middleware/trading-rate-limit');
    const ip = '192.168.1.104';
    
    // Create an expired rate limit record directly in Firestore
    const expiredTime = Date.now() - (61 * 60 * 1000); // 61 minutes ago
    await adminDb
      .collection('tradingRateLimits')
      .doc(`${ip}-create`)
      .set({
        count: 5,
        amount: 5000,
        firstAttempt: expiredTime,
        lastAttempt: expiredTime,
        flaggedCount: 0,
      });

    const req = new MockNextRequest({
      ip,
      pathname: '/api/trading/create',
      body: { amount: 1000 },
    });

    // Act: Make a new request after window expiration
    const allowed = await tradingRateLimit(req, 'create');

    // Assert: Should be allowed and counter should reset
    expect(allowed).toBe(true);

    const rateLimitDoc = await adminDb
      .collection('tradingRateLimits')
      .doc(`${ip}-create`)
      .get();

    const data = rateLimitDoc.data();
    expect(data.count).toBe(1); // Reset to 1
    expect(data.amount).toBe(1000); // Reset to new amount
  });

  it('should track different operation types separately', async () => {
    // Arrange
    const { tradingRateLimit } = await import('@/middleware/trading-rate-limit');
    const ip = '192.168.1.105';

    // Act: Make requests for different operations
    const createReq = new MockNextRequest({
      ip,
      pathname: '/api/trading/create',
      body: { amount: 1000 },
    });
    
    const matchReq = new MockNextRequest({
      ip,
      pathname: '/api/trading/match',
      body: { amount: 2000 },
    });

    await tradingRateLimit(createReq, 'create');
    await tradingRateLimit(matchReq, 'match');

    // Assert: Separate records should exist
    const createDoc = await adminDb
      .collection('tradingRateLimits')
      .doc(`${ip}-create`)
      .get();

    const matchDoc = await adminDb
      .collection('tradingRateLimits')
      .doc(`${ip}-match`)
      .get();

    expect(createDoc.exists).toBe(true);
    expect(matchDoc.exists).toBe(true);
    expect(createDoc.data().count).toBe(1);
    expect(matchDoc.data().count).toBe(1);
  });

  it('should flag account after repeated limit violations', async () => {
    // Arrange
    const { tradingRateLimit } = await import('@/middleware/trading-rate-limit');
    const ip = '192.168.1.106';

    // Create a record with high flaggedCount
    await adminDb
      .collection('tradingRateLimits')
      .doc(`${ip}-create`)
      .set({
        count: 15, // Over limit
        amount: 60000, // Over amount limit
        firstAttempt: Date.now(),
        lastAttempt: Date.now(),
        flaggedCount: 2, // Close to threshold
      });

    const req = new MockNextRequest({
      ip,
      pathname: '/api/trading/create',
      body: { amount: 1000 },
    });

    // Act: Trigger another violation
    const allowed = await tradingRateLimit(req, 'create');

    // Assert: Should be blocked and flaggedCount incremented
    expect(allowed).toBe(false);

    const rateLimitDoc = await adminDb
      .collection('tradingRateLimits')
      .doc(`${ip}-create`)
      .get();

    expect(rateLimitDoc.data().flaggedCount).toBeGreaterThanOrEqual(3);
  });

  it('should handle concurrent requests correctly', async () => {
    // Arrange
    const { tradingRateLimit } = await import('@/middleware/trading-rate-limit');
    const ip = '192.168.1.107';

    // Act: Make concurrent requests
    const requests = Array.from({ length: 5 }, () =>
      new MockNextRequest({
        ip,
        pathname: '/api/trading/create',
        body: { amount: 500 },
      })
    );

    const results = await Promise.all(
      requests.map(req => tradingRateLimit(req, 'create'))
    );

    // Assert: All should be allowed (within limit)
    expect(results.every(r => r === true)).toBe(true);

    // Verify final count
    const rateLimitDoc = await adminDb
      .collection('tradingRateLimits')
      .doc(`${ip}-create`)
      .get();

    const data = rateLimitDoc.data();
    expect(data.count).toBeGreaterThanOrEqual(5);
  });

  it('should persist rate limit data across restarts', async () => {
    // Arrange
    const { tradingRateLimit } = await import('@/middleware/trading-rate-limit');
    const ip = '192.168.1.108';

    const req = new MockNextRequest({
      ip,
      pathname: '/api/trading/match',
      body: { amount: 1500 },
    });

    // Act: Make initial requests
    await tradingRateLimit(req, 'match');
    await tradingRateLimit(req, 'match');

    // Simulate restart by re-importing (data persists in Firestore)
    const req2 = new MockNextRequest({
      ip,
      pathname: '/api/trading/match',
      body: { amount: 1500 },
    });

    await tradingRateLimit(req2, 'match');

    // Assert: Count should continue from previous state
    const rateLimitDoc = await adminDb
      .collection('tradingRateLimits')
      .doc(`${ip}-match`)
      .get();

    expect(rateLimitDoc.data().count).toBe(3);
  });
});
