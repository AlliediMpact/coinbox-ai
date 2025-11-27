import { describe, test, expect, vi } from 'vitest';
import { analyticsService } from '../lib/analytics-service';

// Mock Firebase
vi.mock('firebase/firestore', () => {
  const mockTransactions = [
    {
      id: 'trans-1',
      amount: 1000,
      currency: 'ZAR',
      type: 'payment',
      userId: 'user-123',
      status: 'completed',
      createdAt: new Date('2025-05-01')
    },
    {
      id: 'trans-2',
      amount: 2000,
      currency: 'ZAR',
      type: 'subscription',
      userId: 'user-456',
      status: 'completed',
      createdAt: new Date('2025-05-02')
    }
  ];

  const mockUsers = [
    {
      id: 'user-123',
      displayName: 'Test User 1',
      createdAt: new Date('2025-04-15')
    },
    {
      id: 'user-456',
      displayName: 'Test User 2',
      createdAt: new Date('2025-05-01')
    }
  ];

  return {
    getFirestore: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    startAfter: vi.fn(),
    getDocs: vi.fn(() => Promise.resolve({
      empty: false,
      docs: [...mockTransactions, ...mockUsers].map(item => ({
        id: item.id,
        data: () => item
      })),
      size: mockTransactions.length + mockUsers.length
    })),
    doc: vi.fn(),
    getDoc: vi.fn(() => Promise.resolve({
      exists: () => true,
      data: () => ({ uptime: 99.9, responseTime: 200, errorRate: 0.01 })
    })),
    addDoc: vi.fn(),
    Timestamp: {
      fromDate: (date: Date) => date,
      now: () => new Date()
    }
  };
});

describe('Analytics Service', () => {
  test('should retrieve transaction analytics', async () => {
    const result = await analyticsService.getTransactionAnalytics({
      startDate: new Date('2025-05-01'),
      endDate: new Date('2025-05-24'),
      interval: 'daily'
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
  });

  test('should retrieve user growth metrics', async () => {
    const result = await analyticsService.getUserGrowthMetrics({
      period: 'last_30_days'
    });

    expect(result).toBeDefined();
    expect(result.total).toBeGreaterThan(0);
    expect(result.trend).toBeDefined();
  });

  test('should retrieve system performance metrics', async () => {
    const result = await analyticsService.getSystemPerformanceMetrics();

    expect(result).toBeDefined();
    expect(result.uptime).toBeDefined();
    expect(result.errorRate).toBeDefined();
    expect(result.responseTime).toBeDefined();
  });

  test('should retrieve revenue analytics', async () => {
    const result = await analyticsService.getRevenueAnalytics({
      startDate: new Date('2025-05-01'),
      endDate: new Date('2025-05-24')
    });

    expect(result).toBeDefined();
    expect(result.total).toBeDefined();
    expect(result.breakdown).toBeDefined();
    expect(result.breakdown.length).toBeGreaterThan(0);
  });
});
