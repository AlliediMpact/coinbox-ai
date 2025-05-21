import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tradingRateLimit } from '../middleware/trading-rate-limit';
import { RateLimitExceededError } from '../middleware/rate-limit';

// Mock Redis client
vi.mock('ioredis', () => {
  return {
    default: vi.fn(() => ({
      get: vi.fn(),
      set: vi.fn(),
      incrby: vi.fn(),
      expire: vi.fn(),
      quit: vi.fn()
    }))
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
    req = {
      ip: '127.0.0.1',
      method: 'POST',
      path: '/api/trading/create',
      headers: {
        'x-forwarded-for': '127.0.0.1'
      },
      body: {
        amount: 1000,
        userId: 'user123'
      },
      cookies: {
        session: 'session-token'
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
      const Redis = require('ioredis').default;
      const redisMock = new Redis();
      
      // Mock Redis get to return a value under the limit
      redisMock.get.mockImplementation((key) => {
        if (key.includes('trading:create:user123')) {
          return Promise.resolve('5'); // 5 requests
        }
        if (key.includes('trading:amount:user123')) {
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
      const Redis = require('ioredis').default;
      const redisMock = new Redis();
      
      // Mock Redis get to return a value over the limit
      redisMock.get.mockImplementation((key) => {
        if (key.includes('trading:create:user123')) {
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
      const Redis = require('ioredis').default;
      const redisMock = new Redis();
      
      // Mock Redis get to return a value over the amount limit
      redisMock.get.mockImplementation((key) => {
        if (key.includes('trading:create:user123')) {
          return Promise.resolve('5'); // 5 requests
        }
        if (key.includes('trading:amount:user123')) {
          return Promise.resolve('55000'); // R55,000 (over limit of R50,000)
        }
        return Promise.resolve(null);
      });
      
      req.body.amount = 10000; // This would push it over the limit
      
      // Act
      await tradingRateLimit('create')(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(RateLimitExceededError));
    });
    
    it('should apply different limits based on operation type', async () => {
      // Arrange
      const Redis = require('ioredis').default;
      const redisMock = new Redis();
      
      // Mock Redis get to return different values based on operation
      redisMock.get.mockImplementation((key) => {
        if (key.includes('trading:match:user123')) {
          return Promise.resolve('16'); // 16 requests (over match limit of 15)
        }
        if (key.includes('trading:amount:user123')) {
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
      const Redis = require('ioredis').default;
      const redisMock = new Redis();
      
      // Mock Redis methods
      redisMock.get.mockResolvedValue('5');
      redisMock.incrby.mockResolvedValue(6);
      redisMock.expire.mockResolvedValue(1);
      
      // Act
      await tradingRateLimit('create')(req, res, next);
      
      // Assert
      expect(redisMock.incrby).toHaveBeenCalled();
      expect(redisMock.expire).toHaveBeenCalledWith(
        expect.stringContaining('trading:create:user123'),
        expect.any(Number)
      );
      expect(next).toHaveBeenCalled();
    });
  });
});
