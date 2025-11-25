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

// Mock firestore FieldValue used by server-side monitoring utilities
vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: () => new Date(),
    increment: (n: number) => n
  }
}));

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
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const firebaseApp = require('firebase/app');
  const firebaseUtils = require('firebase/app');
  if (firebaseApp && firebaseApp.getApps && firebaseApp.getApps().length === 0) {
    firebaseApp.initializeApp({
      apiKey: 'test-api-key',
      authDomain: 'localhost',
      projectId: 'test-project',
      appId: '1:123:web:test'
    });
  }
} catch (e) {
  // ignore if firebase client isn't installed in test environment
}

// Ensure PWA service singleton state is reset between tests so tests that mutate
// internal pwaService fields don't leak state across test cases.
beforeEach(() => {
  try {
    // Try to require the pwaService and reset internal pieces
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pwaModule = require('../lib/pwa-service');
    if (pwaModule && pwaModule.pwaService) {
      const svc = pwaModule.pwaService as any;
      try { svc.installPromptEvent = null; } catch (e) {}
      try { svc.serviceWorkerRegistration = null; } catch (e) {}
      try { if (typeof svc.statusCallbacks === 'object') svc.statusCallbacks.length = 0; } catch (e) {}
    }
  } catch (e) {
    // ignore if module not present in test environment
  }
});

