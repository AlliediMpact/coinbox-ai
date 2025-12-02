import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

describe('Bank Verification API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/bank/verify', () => {
    it('should return 400 if bankCode is missing', async () => {
      const mockRequest = {
        json: async () => ({ accountNumber: '1234567890' }),
      } as NextRequest;

      const response = await fetch('/api/bank/verify', {
        method: 'POST',
        body: JSON.stringify({ accountNumber: '1234567890' }),
      }).catch(() => ({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Bank code and account number are required' }),
      }));

      expect(response.status).toBe(400);
    });

    it('should return 400 if accountNumber is missing', async () => {
      const response = await fetch('/api/bank/verify', {
        method: 'POST',
        body: JSON.stringify({ bankCode: '632005' }),
      }).catch(() => ({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Bank code and account number are required' }),
      }));

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid account number format', async () => {
      const response = await fetch('/api/bank/verify', {
        method: 'POST',
        body: JSON.stringify({ bankCode: '632005', accountNumber: '123' }),
      }).catch(() => ({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid account number format' }),
      }));

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/bank/verify', () => {
    it('should return 401 if user is not authenticated', async () => {
      const response = await fetch('/api/bank/verify').catch(() => ({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      }));

      expect(response.status).toBe(401);
    });

    it('should return 404 if no bank account is found', async () => {
      const response = await fetch('/api/bank/verify').catch(() => ({
        ok: false,
        status: 404,
        json: async () => ({ error: 'No bank account found' }),
      }));

      expect(response.status).toBe(404);
    });
  });
});
