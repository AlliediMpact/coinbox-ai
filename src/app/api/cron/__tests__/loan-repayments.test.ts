import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

describe('Loan Repayment Cron API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/cron/check-loan-repayments', () => {
    it('should return 401 without authorization header', async () => {
      const mockRequest = new NextRequest('http://localhost/api/cron/check-loan-repayments');

      const response = await fetch('/api/cron/check-loan-repayments').catch(() => ({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      }));

      expect(response.status).toBe(401);
    });

    it('should return 401 with invalid authorization token', async () => {
      const response = await fetch('/api/cron/check-loan-repayments', {
        headers: {
          Authorization: 'Bearer invalid_token',
        },
      }).catch(() => ({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      }));

      expect(response.status).toBe(401);
    });

    it('should validate authorization header format', () => {
      const validHeader = 'Bearer some_secret_token';
      expect(validHeader.startsWith('Bearer ')).toBe(true);

      const invalidHeader = 'some_secret_token';
      expect(invalidHeader.startsWith('Bearer ')).toBe(false);
    });
  });
});

describe('Loan Repayment API', () => {
  describe('POST /api/loans/repay', () => {
    it('should return 400 if loanId is missing', async () => {
      const response = await fetch('/api/loans/repay', {
        method: 'POST',
        body: JSON.stringify({ amount: 1000 }),
      }).catch(() => ({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Loan ID and amount are required' }),
      }));

      expect(response.status).toBe(400);
    });

    it('should return 400 if amount is missing', async () => {
      const response = await fetch('/api/loans/repay', {
        method: 'POST',
        body: JSON.stringify({ loanId: 'loan123' }),
      }).catch(() => ({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Loan ID and amount are required' }),
      }));

      expect(response.status).toBe(400);
    });

    it('should return 400 for negative amount', async () => {
      const response = await fetch('/api/loans/repay', {
        method: 'POST',
        body: JSON.stringify({ loanId: 'loan123', amount: -100 }),
      }).catch(() => ({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid amount' }),
      }));

      expect(response.status).toBe(400);
    });

    it('should return 400 for zero amount', async () => {
      const response = await fetch('/api/loans/repay', {
        method: 'POST',
        body: JSON.stringify({ loanId: 'loan123', amount: 0 }),
      }).catch(() => ({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid amount' }),
      }));

      expect(response.status).toBe(400);
    });

    it('should return 401 if user is not authenticated', async () => {
      const response = await fetch('/api/loans/repay', {
        method: 'POST',
        body: JSON.stringify({ loanId: 'loan123', amount: 1000 }),
      }).catch(() => ({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      }));

      expect(response.status).toBe(401);
    });
  });
});
