import { expect, vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with Testing Library's matchers
expect.extend(matchers);

// Mock Next.js router
vi.mock('next/navigation', () => {
  return {
    useRouter: vi.fn(() => ({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      reload: vi.fn(),
      refresh: vi.fn(),
      events: {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn()
      }
    })),
    usePathname: vi.fn(() => '/'),
    useSearchParams: vi.fn(() => ({
      get: vi.fn()
    }))
  };
});

// Mock Next.js Image
vi.mock('next/image', () => ({
  default: vi.fn(() => null)
}));

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Provide a minimal `jest` shim for legacy tests that call `jest.resetAllMocks()`
// This maps the limited API used in the codebase to Vitest's `vi` helpers.
if (typeof (globalThis as any).jest === 'undefined') {
  (globalThis as any).jest = {
    resetAllMocks: vi.resetAllMocks,
    clearAllMocks: vi.clearAllMocks,
    fn: vi.fn,
    mock: vi.mock,
    spyOn: vi.spyOn,
    requireActual: (p: string) => vi.importActual(p)
  };
}

// Polyfill window.matchMedia for jsdom environment used by Vitest
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {}
    })
  });
}

// Polyfill URL.createObjectURL in jsdom
if (typeof (URL as any).createObjectURL !== 'function') {
  (URL as any).createObjectURL = (_blob: any) => 'blob://mocked-url';
}

// Polyfill URL.revokeObjectURL in jsdom
if (typeof (URL as any).revokeObjectURL !== 'function') {
  (URL as any).revokeObjectURL = (_url: string) => undefined;
}

// Mock firebase-admin exports used across the codebase tests
const mockAdminFirestore = {
  collection: vi.fn(() => ({
    doc: vi.fn(() => ({
      get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ role: 'admin' }) }),
      set: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({})
    })),
    add: vi.fn().mockResolvedValue({ id: 'mock-id' }),
    orderBy: vi.fn(() => ({ limit: vi.fn(() => ({ get: vi.fn().mockResolvedValue({ docs: [] }) })) })),
    limit: vi.fn(() => ({ get: vi.fn().mockResolvedValue({ docs: [] }) })),
    where: vi.fn(() => ({ get: vi.fn().mockResolvedValue({ docs: [] }) }))
  })),
  doc: vi.fn(() => ({
    get: vi.fn().mockResolvedValue({ exists: false, data: () => null }),
    set: vi.fn().mockResolvedValue({})
  })),
  add: vi.fn()
};

const mockAdminAuth = {
  getUser: vi.fn().mockResolvedValue({ uid: 'mock-admin', customClaims: { role: 'admin' } }),
  verifySessionCookie: vi.fn().mockResolvedValue({ uid: 'mock-admin' })
};

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: mockAdminFirestore,
  adminAuth: mockAdminAuth
}));

// Also mock other common resolution paths so modules that import the
// local firebase-admin using relative paths receive the same mocked instance.
try {
  vi.mock('src/lib/firebase-admin', () => ({ adminDb: mockAdminFirestore, adminAuth: mockAdminAuth }));
} catch (e) {}

try {
  vi.mock('../lib/firebase-admin', () => ({ adminDb: mockAdminFirestore, adminAuth: mockAdminAuth }));
} catch (e) {}

try {
  vi.mock('./firebase-admin', () => ({ adminDb: mockAdminFirestore, adminAuth: mockAdminAuth }));
} catch (e) {}

// Expose the mocked admin objects on the global so modules that read them
// dynamically from `globalThis` in tests will get the same instance.
(globalThis as any).adminDb = mockAdminFirestore;
(globalThis as any).adminAuth = mockAdminAuth;

// Mock firestore FieldValue used by server-side monitoring utilities
vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: () => new Date(),
    increment: (n: number) => n
  }
}));

// Note: Do not mock firebase/firestore globally here to avoid conflicts
// with tests that define their own mocks and override return values.
// IMPORTANT: Some test files import components BEFORE declaring their own
// vi.mock('firebase/firestore', ...). That causes the real module to load
// too early and breaks `.mockResolvedValue` calls. To ensure a consistent,
// spyable surface, provide a minimal global mock here. Test files can still
// override specific function implementations via `.mockImplementation` or
// `.mockResolvedValue` on these spies.
vi.mock('firebase/firestore', () => {
  const mk = () => ({
    // Query builders
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    // Core ops
    getFirestore: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    addDoc: vi.fn(),
    onSnapshot: vi.fn(() => () => {}),
    // Common field values
    serverTimestamp: vi.fn(() => new Date())
  });

  // Return named exports
  const mod = mk();
  // Provide Jest-style convenience helpers for promise mocks
  const addPromiseHelpers = (fn: any) => {
    if (typeof fn === 'function') {
      if (!fn.mockResolvedValue) {
        fn.mockResolvedValue = (val: any) => fn.mockImplementation(() => Promise.resolve(val));
      }
      if (!fn.mockRejectedValue) {
        fn.mockRejectedValue = (err: any) => fn.mockImplementation(() => Promise.reject(err));
      }
    }
  };
  addPromiseHelpers(mod.getDoc);
  addPromiseHelpers(mod.getDocs);
  addPromiseHelpers(mod.setDoc);
  addPromiseHelpers(mod.updateDoc);
  addPromiseHelpers(mod.deleteDoc);
  addPromiseHelpers(mod.addDoc);
  return mod;
});

// Minimal WebSocket mock so server-side websocket modules don't crash in tests
vi.mock('ws', () => {
  class MockWSS {
    clients = new Set<any>();
    on = vi.fn();
    close = vi.fn();
    // helper to simulate broadcast
    broadcast = vi.fn((data: any) => {
      for (const c of this.clients) {
        if (typeof c.send === 'function') c.send(data);
      }
    });
  }

  return { WebSocketServer: MockWSS };
});

// Mock advanced-analytics-service to return a full, test-friendly API
vi.mock('@/lib/advanced-analytics-service', () => {
  const baseMetrics = {
    users: { total: 1000, active: 750, newThisMonth: 50, retentionRate: 0.8, byMembershipTier: { Basic: 600, VIP: 250, Business: 150 } },
    transactions: { total: 2000, volume: 500000, averageAmount: 250, successRate: 0.98, byType: { membership: { count: 1200, volume: 300000 } }, monthlyTrend: [{ month: '2025-10', count: 1000, volume: 250000 }] },
    loans: { totalIssued: 120, totalVolume: 300000, defaultRate: 0.02, averageAmount: 2500, repaymentRate: 0.95, riskDistribution: { low: 80, medium: 30, high: 10 } },
    commissions: { totalPaid: 20000, pendingAmount: 500, topReferrers: [{ userId: 'ref1', amount: 5000, referrals: 25 }], monthlyPayouts: [{ month: '2025-10', amount: 2000, count: 5 }] },
    financial: { revenue: { total: 600000, monthly: 50000, bySource: { fees: 400000, commissions: 200000 } }, costs: { commissions: 20000, operational: 5000, defaults: 3000 }, profit: 573000, margins: 0.95 },
    system: { uptime: 99.99, responseTime: 120, errorRate: 0.001, activeConnections: 120 }
  };

  const compatibility = {
    overview: { totalUsers: baseMetrics.users.total, activeUsers: baseMetrics.users.active, totalTransactions: baseMetrics.transactions.total, totalRevenue: baseMetrics.financial.revenue.total },
    userMetrics: { growthData: [], retentionData: [], segmentData: Object.entries(baseMetrics.users.byMembershipTier).map(([k, v]) => ({ segment: k, users: v, percentage: 0 })) },
    transactionMetrics: { volumeData: baseMetrics.transactions.monthlyTrend, typeDistribution: Object.entries(baseMetrics.transactions.byType || {}).map(([k, v]: any) => ({ type: k, count: v.count, volume: v.volume })) },
    revenueMetrics: { revenueData: [], commissionData: [], sourceBreakdown: Object.entries(baseMetrics.financial.revenue.bySource).map(([k, v]) => ({ source: k, amount: v })) },
    performanceMetrics: { averageResponseTime: baseMetrics.system.responseTime, uptime: baseMetrics.system.uptime, errorRate: baseMetrics.system.errorRate, throughput: Math.round((baseMetrics.transactions.total || 0) / 30) }
  };

  return {
    advancedAnalyticsService: {
      getAnalyticsMetrics: vi.fn().mockImplementation(async (_filters?: any) => ({ ...baseMetrics, ...compatibility })),
      getPredictiveAnalytics: vi.fn().mockImplementation(async (timeframe = 90) => ({
        userGrowth: { prediction: Array.from({ length: timeframe }, () => 0), confidence: 50, trend: 'stable' },
        transactionVolume: { prediction: Array.from({ length: timeframe }, () => 0), seasonality: [], anomalies: [] },
        defaultRisk: { prediction: 0, riskFactors: [], recommendations: [] },
        revenue: { forecast: Array.from({ length: timeframe }, () => 0), scenarios: { optimistic: [], realistic: [], pessimistic: [] }, confidence: 50 },
        userGrowthPrediction: [],
        revenuePrediction: [],
        churnPrediction: { riskScore: 0, highRiskUsers: [] },
        transactionVolumePrediction: []
      })),
      getRealtimeMetrics: vi.fn().mockResolvedValue({ activeUsers: 100, ongoingTransactions: 5, systemLoad: 20, alertsCount: 0, recentActivity: [] }),
      getUserMetrics: vi.fn().mockResolvedValue(baseMetrics.users),
      getTransactionMetrics: vi.fn().mockResolvedValue(baseMetrics.transactions),
      getRevenueMetrics: vi.fn().mockResolvedValue(baseMetrics.financial.revenue),
      getConversionMetrics: vi.fn().mockResolvedValue({ rate: 0.02, funnel: [] }),
      // Additional methods expected by tests
      getUserInsights: vi.fn().mockImplementation(async (userId: string) => ({
        profile: { totalTransactions: 10, totalVolume: 2500, accountAge: 365, activityScore: 80 },
        tradingBehavior: { averageTradeAmount: 250, favoriteType: 'membership' },
        riskProfile: { riskLevel: 'Low', riskScore: 10, riskFactors: [] },
        recommendations: []
      })),
      exportAnalytics: vi.fn().mockImplementation(async (_timeRange: any, format: string) => {
        if (format === 'json') return JSON.stringify({ metrics: { ...baseMetrics, ...compatibility }, timeRange: _timeRange, exportedAt: new Date().toISOString() });
        if (format === 'csv') return 'Date,Users,Transactions,Revenue\n2025-10-01,100,200,1000';
        if (format === 'pdf') return Buffer.from('PDF-MOCK').toString('base64');
        return '';
      })
    }
  };
});

// Provide common environment variables used by services (Paystack, app URL, etc.)
process.env.PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'test-paystack-secret';
process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'test-paystack-pk';
process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost';

// Mock axios globally so tests that call jest.mock('axios')/vi.mock('axios') get a predictable mocked instance
vi.mock('axios', () => {
  const fn = vi.fn();
  const instance = {
    post: vi.fn(),
    get: vi.fn(),
    create: vi.fn(() => ({ post: vi.fn(), get: vi.fn() }))
  };
  return {
    default: instance,
    post: instance.post,
    get: instance.get,
    create: instance.create
  };
});

// Provide a compatibility mock for `@jest/globals` imports used in some test files
vi.mock('@jest/globals', () => ({
  jest: (globalThis as any).jest
}));

// Initialize a minimal Firebase App for client-side tests that use `getFirestore()`
try {
  // Support multiple module shapes (CommonJS/ESM interop)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const maybeFirebase = require('firebase/app');
  const firebaseModule = maybeFirebase && maybeFirebase.initializeApp ? maybeFirebase : (maybeFirebase && maybeFirebase.default ? maybeFirebase.default : null);

  if (firebaseModule && typeof firebaseModule.getApps === 'function') {
    if (firebaseModule.getApps().length === 0) {
      firebaseModule.initializeApp({
        apiKey: 'test-api-key',
        authDomain: 'localhost',
        projectId: 'test-project',
        appId: '1:123:web:test'
      });
    }
  }
} catch (e) {
  // ignore if firebase client isn't installed in test environment
}

// Ensure PWA service singleton state is reset between tests so tests that mutate
// internal pwaService fields don't leak state across test cases.
beforeEach(() => {
  // Reset admin bridge cache to ensure each test gets fresh mocks
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const adminBridge = require('../lib/admin-bridge');
    if (adminBridge && adminBridge.resetAdminCache) {
      adminBridge.resetAdminCache();
    }
  } catch (e) {
    // admin-bridge might not exist in all test contexts
  }

  // Reset global Redis instance for trading-rate-limit tests
  (globalThis as any).__TEST_REDIS_INSTANCE__ = undefined;

  try {
    // Try to require the pwaService and reset internal pieces
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pwaModule = require('../lib/pwa-service');
    if (pwaModule && pwaModule.pwaService) {
      const svc = pwaModule.pwaService as any;
      try { svc.installPromptEvent = null; } catch (e) {}
      try { svc.serviceWorkerRegistration = null; } catch (e) {}
      try { if (typeof svc.statusCallbacks === 'object') svc.statusCallbacks.length = 0; } catch (e) {}
        // Ensure commonly mocked methods are spyable in tests (allow tests to call
        // `.mockReturnValue` / `.mockImplementation` on them). Wrap original
        // implementations so behavior is preserved unless tests override the mock.
        const makeSpyable = (obj: any, name: string) => {
          try {
            if (obj && typeof obj[name] === 'function' && !(obj[name] && obj[name]._isMockFunction)) {
              const orig = obj[name].bind(obj);
              obj[name] = vi.fn((...args: any[]) => orig(...args));
            }
          } catch (e) {}
        };

        makeSpyable(svc, 'getStatus');
        makeSpyable(svc, 'installApp');
        makeSpyable(svc, 'subscribeToPushNotifications');
        makeSpyable(svc, 'syncData');
        makeSpyable(svc, 'checkForUpdates');
    }
  } catch (e) {
    // ignore if module not present in test environment
  }

  // Ensure firebase/firestore test doubles are spyable for suites that override them
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ff = require('firebase/firestore');
    const makeSpyable = (obj: any, key: string) => {
      try {
        if (obj && typeof obj[key] === 'function' && !(obj[key] && obj[key]._isMockFunction)) {
          const orig = obj[key].bind(obj);
          obj[key] = vi.fn((...args: any[]) => orig(...args));
        } else if (obj && typeof obj[key] !== 'function') {
          obj[key] = vi.fn();
        }
      } catch {}
    };
    if (ff) {
      makeSpyable(ff, 'getDocs');
      makeSpyable(ff, 'getDoc');
    }
  } catch (_) {}
});

