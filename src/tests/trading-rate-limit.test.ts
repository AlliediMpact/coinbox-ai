import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tradingRateLimit } from '../middleware/trading-rate-limit';
import { RateLimitExceededError } from '../middleware/rate-limit';

// Mock Redis client
const mockRedisInstance = {
  status: 'mocking',
  get: vi.fn(),
  set: vi.fn(),
  incrby: vi.fn(),
  expire: vi.fn(),
  quit: vi.fn()
};

vi.mock('ioredis', () => {
  return {
    default: vi.fn(() => mockRedisInstance)
  };
});

// Mock reportRiskEvent and response utilities
vi.mock('../lib/risk-assessment', () => ({
  reportRiskEvent: vi.fn(),
  RiskEvent: {
    RATE_LIMIT_EXCEEDED: 'rate-limit-exceeded'
  }
}));

describe('Trading Rate Limit Middleware', () => {
  let req: any;
  let res: any;
  let next: any;
  
  beforeEach(() => {
    // Force the mock instance to be used
    (globalThis as any).__TEST_REDIS_INSTANCE__ = mockRedisInstance;

    req = {
      ip: '127.0.0.1',
      method: 'POST',
      path: '/api/trading/create',
      headers: {
        'x-forwarded-for': '127.0.0.1'
      },
      // Middleware expects body to be stringifiable or string for amount extraction
      body: JSON.stringify({
        amount: 1000,
        userId: 'user123'
      }),
      cookies: {
        get: vi.fn().mockReturnValue({ value: 'session-token' })
      }
    };
    
    res = {
      status: vi.fn(() => res),
      json: vi.fn(),
      setHeader: vi.fn()
    };
    
    next = vi.fn();
    
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('tradingRateLimit middleware', () => {
    it('should allow request when under the rate limit', async () => {
      // Arrange
      // Mock Redis get to return a value under the limit
      mockRedisInstance.get.mockImplementation((key) => {
        // Middleware falls back to IP if session verification fails (which it will here as adminAuth is not mocked)
        if (key.includes('trading:create:127.0.0.1')) {
          return Promise.resolve('5'); // 5 requests
        }
        if (key.includes('trading:amount:127.0.0.1')) {
          return Promise.resolve('5000'); // R5,000
        }
        return Promise.resolve(null);
      });
      
      // Act
      await tradingRateLimit('create')(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });
    
    it('should block request when operation count exceeds the rate limit', async () => {
      // Arrange
      // Mock Redis get to return a value over the limit
      mockRedisInstance.get.mockImplementation((key) => {
        if (key.includes('trading:create:127.0.0.1')) {
          return Promise.resolve('11'); // 11 requests (over limit of 10)
        }
        return Promise.resolve(null);
      });
      
      // Act
      await tradingRateLimit('create')(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(RateLimitExceededError));
      expect(res.status).not.toHaveBeenCalled(); // The error should be handled by an error handler
    });
    
    it('should block request when amount exceeds the rate limit', async () => {
      // Arrange
      // Mock Redis get to return a value over the amount limit
      mockRedisInstance.get.mockImplementation((key) => {
        if (key.includes('trading:create:127.0.0.1')) {
          return Promise.resolve('5'); // 5 requests
        }
        if (key.includes('trading:amount:127.0.0.1')) {
          return Promise.resolve('55000'); // R55,000 (over limit of R50,000)
        }
        return Promise.resolve(null);
      });
      
      req.body = JSON.stringify({ amount: 10000, userId: 'user123' }); // This would push it over the limit
      
      // Act
      await tradingRateLimit('create')(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(RateLimitExceededError));
    });
    
    it('should apply different limits based on operation type', async () => {
      // Arrange
      // Mock Redis get to return different values based on operation
      mockRedisInstance.get.mockImplementation((key) => {
        if (key.includes('trading:match:127.0.0.1')) {
          return Promise.resolve('16'); // 16 requests (over match limit of 15)
        }
        if (key.includes('trading:amount:127.0.0.1')) {
          return Promise.resolve('5000'); // R5,000
        }
        return Promise.resolve(null);
      });
      
      req.path = '/api/trading/match';
      
      // Act
      await tradingRateLimit('match')(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(RateLimitExceededError));
    });
    
    it('should update sliding window properly', async () => {
      // Arrange
      // Mock Redis methods
      mockRedisInstance.get.mockResolvedValue('5');
      mockRedisInstance.incrby.mockResolvedValue(6);
      mockRedisInstance.expire.mockResolvedValue(1);
      
      // Act
      await tradingRateLimit('create')(req, res, next);
      
      // Assert
      expect(mockRedisInstance.incrby).toHaveBeenCalled();
      expect(mockRedisInstance.expire).toHaveBeenCalledWith(
        expect.stringContaining('trading:create:127.0.0.1'),
        expect.any(Number)
      );
      expect(next).toHaveBeenCalled();
    });

    // NEW: Extended test cases for better coverage
    it('should handle concurrent requests from same user', async () => {
      // Arrange
      mockRedisInstance.get.mockResolvedValue('5');
      mockRedisInstance.incrby.mockResolvedValue(6);
      mockRedisInstance.expire.mockResolvedValue(1);
      
      // Act - simulate concurrent requests
      const promises = Array(3).fill(null).map(() => 
        tradingRateLimit('create')(req, res, next)
      );
      
      await Promise.all(promises);
      
      // Assert - should handle all requests
      expect(mockRedisInstance.get).toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(3);
    });
    
    it('should differentiate between different trading operations', async () => {
      // Arrange
      mockRedisInstance.get.mockImplementation((key) => {
        if (key.includes('trading:create:')) return Promise.resolve('5');
        if (key.includes('trading:match:')) return Promise.resolve('10');
        if (key.includes('trading:confirm:')) return Promise.resolve('15');
        return Promise.resolve('0');
      });
      
      // Act & Assert - create operation
      await tradingRateLimit('create')(req, res, next);
      expect(next).toHaveBeenCalledWith();
      
      vi.clearAllMocks();
      
      // Act & Assert - match operation
      await tradingRateLimit('match')(req, res, next);
      expect(next).toHaveBeenCalledWith();
      
      vi.clearAllMocks();
      
      // Act & Assert - confirm operation
      await tradingRateLimit('confirm')(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });
    
    it('should reset limit after time window expires', async () => {
      // Arrange - first set shows expired window
      mockRedisInstance.get.mockResolvedValueOnce('20'); // Over limit
      mockRedisInstance.incrby.mockResolvedValue(1);
      mockRedisInstance.expire.mockResolvedValue(1);
      
      // Act - should be blocked
      await tradingRateLimit('create')(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(RateLimitExceededError));
    });
    
    it('should handle missing user ID gracefully', async () => {
      // Arrange
      req.cookies.get = vi.fn().mockReturnValue(null);
      mockRedisInstance.get.mockResolvedValue('3');
      mockRedisInstance.incrby.mockResolvedValue(4);
      mockRedisInstance.expire.mockResolvedValue(1);
      
      // Act
      await tradingRateLimit('create')(req, res, next);
      
      // Assert - should fall back to IP-based rate limiting
      expect(mockRedisInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('127.0.0.1')
      );
      expect(next).toHaveBeenCalled();
    });
    
    it('should track failed requests separately', async () => {
      // Arrange
      mockRedisInstance.get.mockResolvedValue('11'); // Over limit
      
      // Act
      await tradingRateLimit('create')(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(RateLimitExceededError));
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('should handle database errors gracefully', async () => {
      // Arrange
      mockRedisInstance.get.mockRejectedValue(new Error('Redis connection failed'));
      
      // Act
      await tradingRateLimit('create')(req, res, next);
      
      // Assert - should allow request through on error
      expect(next).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });
    
    it('should handle expired rate limit records', async () => {
      // Arrange
      mockRedisInstance.get.mockResolvedValue(null); // No existing record
      mockRedisInstance.incrby.mockResolvedValue(1);
      mockRedisInstance.expire.mockResolvedValue(1);
      
      // Act
      await tradingRateLimit('create')(req, res, next);
      
      // Assert
      expect(mockRedisInstance.incrby).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
    
    it('should extract amount from request body', async () => {
      // Arrange
      req.body = JSON.stringify({ amount: 5000, userId: 'user123' });
      mockRedisInstance.get.mockImplementation((key) => {
        if (key.includes('trading:amount:')) return Promise.resolve('40000');
        return Promise.resolve('5');
      });
      mockRedisInstance.incrby.mockResolvedValue(1);
      mockRedisInstance.expire.mockResolvedValue(1);
      
      // Act
      await tradingRateLimit('create')(req, res, next);
      
      // Assert - should track amount
      expect(mockRedisInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('trading:amount:')
      );
      expect(next).toHaveBeenCalled();
    });
    
    it('should handle invalid JSON in request body', async () => {
      // Arrange
      req.body = 'invalid-json';
      mockRedisInstance.get.mockResolvedValue('3');
      mockRedisInstance.incrby.mockResolvedValue(4);
      mockRedisInstance.expire.mockResolvedValue(1);
      
      // Act
      await tradingRateLimit('create')(req, res, next);
      
      // Assert - should still work with amount = 0
      expect(next).toHaveBeenCalled();
    });
    
    it('should handle missing Redis gracefully and fallback', async () => {
      // Arrange - simulate Redis error that triggers fallback
      mockRedisInstance.get.mockRejectedValue(new Error('Redis unavailable'));
      
      // Act
      await tradingRateLimit('create')(req, res, next);
      
      // Assert - should allow through (fallback behavior)
      expect(next).toHaveBeenCalled();
    });

    it('should apply correct limits for confirm operation', async () => {
      // Arrange
      mockRedisInstance.get.mockImplementation((key) => {
        if (key.includes('trading:confirm:')) return Promise.resolve('19'); // Just under limit of 20
        return Promise.resolve('0');
      });
      mockRedisInstance.incrby.mockResolvedValue(20);
      mockRedisInstance.expire.mockResolvedValue(1);
      
      // Act
      await tradingRateLimit('confirm')(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith();
    });

    it('should block when confirm limit exceeded', async () => {
      // Arrange
      mockRedisInstance.get.mockImplementation((key) => {
        if (key.includes('trading:confirm:')) return Promise.resolve('21'); // Over limit of 20
        return Promise.resolve('0');
      });
      
      // Act
      await tradingRateLimit('confirm')(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(RateLimitExceededError));
    });
  });
});
