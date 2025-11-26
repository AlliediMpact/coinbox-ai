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
  });
});
