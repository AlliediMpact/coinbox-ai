/**
 * Admin Bridge - Centralized accessor for Firebase Admin instances
 * Provides a single point to resolve adminDb and adminAuth, ensuring tests
 * and runtime code use the same mocked/actual instances.
 */

let cachedAdminDb: any = null;
let cachedAdminAuth: any = null;
let cachedFieldValue: any = null;

export function getAdminDb(): any {
  // Always attempt to resolve the admin module paths first. Returning a
  // previously cached admin instance without checking the module system can
  // cause tests that set up runtime mocks (or call `jest.mock`/`vi.mock`) to
  // be ignored. We still store the resolved instance in the cache for
  // performance, but we don't short-circuit resolution by returning the cache
  // immediately.

  // Try multiple resolution paths to accommodate different import patterns
  // 1. Try aliased path (mocked by tests)
  try {
    const mod = require('@/lib/firebase-admin');
    if (mod && mod.adminDb) {
      cachedAdminDb = mod.adminDb;
      return cachedAdminDb;
    }
  } catch (e) {}

  // 2. Try relative path
  try {
    const mod = require('./firebase-admin');
    if (mod && mod.adminDb) {
      cachedAdminDb = mod.adminDb;
      return cachedAdminDb;
    }
  } catch (e) {}

  // 3. Check globalThis (test setup may expose it here)
  if ((globalThis as any).adminDb) {
    cachedAdminDb = (globalThis as any).adminDb;
    return cachedAdminDb;
  }

  return null;
}

export function getAdminAuth(): any {
  // Attempt to resolve the auth instance each call so tests can override the
  // module at runtime and have the new instance picked up.
  try {
    const mod = require('@/lib/firebase-admin');
    if (mod && mod.adminAuth) {
      cachedAdminAuth = mod.adminAuth;
      return cachedAdminAuth;
    }
  } catch (e) {}

  try {
    const mod = require('./firebase-admin');
    if (mod && mod.adminAuth) {
      cachedAdminAuth = mod.adminAuth;
      return cachedAdminAuth;
    }
  } catch (e) {}

  if ((globalThis as any).adminAuth) {
    cachedAdminAuth = (globalThis as any).adminAuth;
    return cachedAdminAuth;
  }

  return null;
}

export function getFieldValue(): any {
  // Resolve FieldValue each call to pick up test-provided mocks.
  try {
    const mod = require('firebase-admin/firestore');
    if (mod && mod.FieldValue) {
      cachedFieldValue = mod.FieldValue;
      return cachedFieldValue;
    }
  } catch (e) {}

  if ((globalThis as any).FieldValue) {
    cachedFieldValue = (globalThis as any).FieldValue;
    return cachedFieldValue;
  }

  // Fallback stub
  return {
    serverTimestamp: () => new Date(),
    increment: (n: number) => n
  };
}

// Reset cache (useful for tests)
export function resetAdminCache(): void {
  cachedAdminDb = null;
  cachedAdminAuth = null;
  cachedFieldValue = null;
}
