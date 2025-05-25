import { analyticsService } from '../lib/analytics-service';

// Mock Firebase
jest.mock('firebase/firestore', () => {
  const mockData = {
    transactions: [
      {
        id: 'trans-1',
        amount: 1000,
        currency: 'ZAR',
        type: 'deposit',
        userId: 'user-123',
        status: 'completed',
        createdAt: new Date('2025-05-01')
      },
      {
        id: 'trans-2',
        amount: 2000,
        currency: 'ZAR',
        type: 'withdrawal',
        userId: 'user-456',
        status: 'completed',
        createdAt: new Date('2025-05-02')
      }
    ],
    users: [
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
    ]
  };

  return {
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    startAfter: jest.fn(),
    getDocs: jest.fn(() => Promise.resolve({
      empty: false,
      docs: mockData.transactions.map(trans => ({
        id: trans.id,
        data: () => trans
      }))
    })),
    doc: jest.fn(),
    getDoc: jest.fn(() => Promise.resolve({
      exists: () => true,
      data: () => mockData.users[0]
    }))
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
  });
});
