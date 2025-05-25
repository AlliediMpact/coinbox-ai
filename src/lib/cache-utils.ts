/**
 * Caching Utilities
 * 
 * This module provides caching functionality for the CoinBox platform to optimize
 * performance of frequently accessed data and reduce database load.
 */

// In-memory LRU cache implementation
type CacheEntry<T> = {
  data: T;
  expiry: number;
};

class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private readonly maxSize: number;

  constructor(maxSize = 100) {
    this.cache = new Map<string, CacheEntry<T>>();
    this.maxSize = maxSize;
  }

  // Get item from cache
  get(key: string): CacheEntry<T> | undefined {
    // If the item doesn't exist or is expired, return undefined
    const item = this.cache.get(key);
    if (!item || item.expiry < Date.now()) {
      this.cache.delete(key); // Clean up expired items
      return undefined;
    }
    
    // Move the accessed item to the end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, item);
    
    return item;
  }

  // Set item in cache with expiry
  set(key: string, value: T, ttlMs = 5 * 60 * 1000): void {
    // If we're at capacity, remove the least recently used item (first item)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    // Add the new item
    this.cache.set(key, {
      data: value,
      expiry: Date.now() + ttlMs
    });
  }

  // Remove item from cache
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Clear entire cache
  clear(): void {
    this.cache.clear();
  }

  // Get cache size
  get size(): number {
    return this.cache.size;
  }
  
  // Clean expired entries
  purgeExpired(): number {
    const initialSize = this.cache.size;
    const now = Date.now();
    
    for (const [key, value] of this.cache.entries()) {
      if (value.expiry < now) {
        this.cache.delete(key);
      }
    }
    
    return initialSize - this.cache.size;
  }
}

// Create instances for different cache types
export const queryCache = new LRUCache<any>(200); // For database query results
export const userDataCache = new LRUCache<any>(100); // For user profile data
export const staticDataCache = new LRUCache<any>(50); // For rarely changing data
export const computedDataCache = new LRUCache<any>(100); // For expensive computed values

/**
 * Cached query execution - wraps a query function with caching logic
 * @param queryFn Function that performs the actual query
 * @param cacheKey Unique key for the cache entry
 * @param ttlMs Time-to-live in milliseconds
 */
export async function cachedQuery<T>(
  queryFn: () => Promise<T>, 
  cacheKey: string, 
  ttlMs = 5 * 60 * 1000
): Promise<T> {
  // Try to get from cache first
  const cachedResult = queryCache.get(cacheKey);
  if (cachedResult) {
    return cachedResult.data;
  }
  
  // Execute the query
  const result = await queryFn();
  
  // Store in cache
  queryCache.set(cacheKey, result, ttlMs);
  
  return result;
}

/**
 * Memoized function - caches results of expensive computations
 * @param fn Function to memoize
 * @param getKey Function to generate cache key from arguments
 * @param ttlMs Time-to-live in milliseconds
 */
export function memoize<T, Args extends any[]>(
  fn: (...args: Args) => T,
  getKey: (...args: Args) => string,
  ttlMs = 60000
): (...args: Args) => T {
  return (...args: Args): T => {
    const cacheKey = getKey(...args);
    const cached = computedDataCache.get(cacheKey);
    
    if (cached) {
      return cached.data;
    }
    
    const result = fn(...args);
    computedDataCache.set(cacheKey, result, ttlMs);
    return result;
  };
}

// Helper to periodically clean caches
let cleanupInterval: NodeJS.Timeout | null = null;

export function startCacheCleanup(intervalMs = 60000): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  
  cleanupInterval = setInterval(() => {
    queryCache.purgeExpired();
    userDataCache.purgeExpired();
    staticDataCache.purgeExpired();
    computedDataCache.purgeExpired();
  }, intervalMs);
}

export function stopCacheCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}
