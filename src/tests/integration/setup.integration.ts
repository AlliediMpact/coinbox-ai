/**
 * Integration Test Setup
 * Minimal setup for Firebase Emulator integration tests
 * Does NOT mock Firebase modules - we use the real Firebase SDK
 */

import { expect, afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with Testing Library's matchers
expect.extend(matchers);

// Polyfill window.matchMedia for jsdom environment
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
      removeEventListener: () => {},
    }),
  });
}

// Polyfill URL.createObjectURL
if (typeof (URL as any).createObjectURL !== 'function') {
  (URL as any).createObjectURL = (_blob: any) => 'blob://mocked-url';
}

// Polyfill URL.revokeObjectURL
if (typeof (URL as any).revokeObjectURL !== 'function') {
  (URL as any).revokeObjectURL = (_url: string) => undefined;
}

// Clean up after each test
afterEach(() => {
  // Integration tests handle their own cleanup via cleanupTestEnvironment()
});

// Set environment variables for emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

// Increase test timeout for integration tests
if (typeof jest !== 'undefined') {
  jest.setTimeout(30000);
}
