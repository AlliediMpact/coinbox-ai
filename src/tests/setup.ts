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

