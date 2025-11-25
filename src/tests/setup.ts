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
