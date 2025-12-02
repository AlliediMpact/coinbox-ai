import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  validateAccountNumber,
  SOUTH_AFRICAN_BANKS 
} from '@/lib/bank-verification-service';

// Mock Firebase
vi.mock('@/config/firebase', () => ({
  db: {},
}));

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
  },
}));

// Mock the actual service functions
const mockVerifyBankAccount = vi.fn();
const mockStoreBankAccount = vi.fn();
const mockGetBankAccount = vi.fn();

describe('Bank Verification Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch for Paystack API
    global.fetch = vi.fn();
  });

  describe('validateAccountNumber', () => {
    it('should validate correct SA account number (9 digits)', () => {
      expect(validateAccountNumber('123456789')).toBe(true);
    });

    it('should validate correct SA account number (10 digits)', () => {
      expect(validateAccountNumber('1234567890')).toBe(true);
    });

    it('should validate correct SA account number (11 digits)', () => {
      expect(validateAccountNumber('12345678901')).toBe(true);
    });

    it('should reject account number with less than 9 digits', () => {
      expect(validateAccountNumber('12345678')).toBe(false);
    });

    it('should reject account number with more than 11 digits)', () => {
      expect(validateAccountNumber('123456789012')).toBe(false);
    });

    it('should reject account number with non-numeric characters', () => {
      expect(validateAccountNumber('12345ABC9')).toBe(false);
    });

    it('should reject empty account number', () => {
      expect(validateAccountNumber('')).toBe(false);
    });

    it('should reject null or undefined', () => {
      expect(validateAccountNumber(null as any)).toBe(false);
      expect(validateAccountNumber(undefined as any)).toBe(false);
    });
  });

  describe('SOUTH_AFRICAN_BANKS', () => {
    it('should have 10 major SA banks', () => {
      expect(SOUTH_AFRICAN_BANKS).toHaveLength(10);
    });

    it('should include major banks with correct codes', () => {
      const bankCodes = SOUTH_AFRICAN_BANKS.map(b => b.code);
      expect(bankCodes).toContain('632005'); // ABSA
      expect(bankCodes).toContain('470010'); // Capitec
      expect(bankCodes).toContain('250655'); // FNB
      expect(bankCodes).toContain('580105'); // Investec
      expect(bankCodes).toContain('198765'); // Nedbank
      expect(bankCodes).toContain('051001'); // Standard Bank
    });

    it('should have unique bank codes', () => {
      const codes = SOUTH_AFRICAN_BANKS.map(b => b.code);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });

    it('should have all required fields', () => {
      SOUTH_AFRICAN_BANKS.forEach(bank => {
        expect(bank).toHaveProperty('code');
        expect(bank).toHaveProperty('name');
        expect(bank.code).toBeTruthy();
        expect(bank.name).toBeTruthy();
      });
    });
  });

  describe('verifyBankAccount', () => {
    it('should verify valid bank account via Paystack API', async () => {
      const mockResponse = {
        status: true,
        message: 'Account number resolved',
        data: {
          account_number: '1234567890',
          account_name: 'John Doe',
          bank_id: 1,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await verifyBankAccount('632005', '1234567890');

      expect(result.success).toBe(true);
      expect(result.accountName).toBe('John Doe');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.paystack.co/bank/resolve?account_number=1234567890&bank_code=632005',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Bearer'),
          }),
        })
      );
    });

    it('should handle invalid account number from Paystack', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({
          status: false,
          message: 'Could not resolve account name',
        }),
      });

      const result = await verifyBankAccount('632005', '9999999999');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await verifyBankAccount('632005', '1234567890');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should reject invalid account number format', async () => {
      const result = await verifyBankAccount('632005', 'invalid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid account number format');
    });

    it('should reject empty bank code', async () => {
      const result = await verifyBankAccount('', '1234567890');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should handle Paystack API rate limiting', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          status: false,
          message: 'Too many requests',
        }),
      });

      const result = await verifyBankAccount('632005', '1234567890');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('storeBankAccount', () => {
    it('should store verified bank account to Firestore', async () => {
      const { setDoc } = await import('firebase/firestore');
      (setDoc as any).mockResolvedValueOnce(undefined);

      await storeBankAccount(
        'user123',
        '632005',
        'ABSA Bank',
        '1234567890',
        'John Doe'
      );

      expect(setDoc).toHaveBeenCalled();
    });

    it('should handle Firestore write errors', async () => {
      const { setDoc } = await import('firebase/firestore');
      (setDoc as any).mockRejectedValueOnce(new Error('Firestore error'));

      await expect(
        storeBankAccount(
          'user123',
          '632005',
          'ABSA Bank',
          '1234567890',
          'John Doe'
        )
      ).rejects.toThrow();
    });

    it('should reject missing required fields', async () => {
      await expect(
        storeBankAccount('', '632005', 'ABSA', '123', 'John')
      ).rejects.toThrow();
    });
  });

  describe('getBankAccount', () => {
    it('should retrieve stored bank account', async () => {
      const { getDoc } = await import('firebase/firestore');
      (getDoc as any).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          userId: 'user123',
          bankCode: '632005',
          bankName: 'ABSA Bank',
          accountNumber: '1234567890',
          accountName: 'John Doe',
          verified: true,
        }),
      });

      const account = await getBankAccount('user123');

      expect(account).toBeTruthy();
      expect(account?.bankName).toBe('ABSA Bank');
      expect(account?.accountName).toBe('John Doe');
    });

    it('should return null if account not found', async () => {
      const { getDoc } = await import('firebase/firestore');
      (getDoc as any).mockResolvedValueOnce({
        exists: () => false,
      });

      const account = await getBankAccount('user123');

      expect(account).toBeNull();
    });

    it('should handle Firestore read errors', async () => {
      const { getDoc } = await import('firebase/firestore');
      (getDoc as any).mockRejectedValueOnce(new Error('Firestore error'));

      await expect(getBankAccount('user123')).rejects.toThrow();
    });

    it('should reject empty user ID', async () => {
      await expect(getBankAccount('')).rejects.toThrow();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle full verification and storage flow', async () => {
      // Mock successful Paystack verification
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: true,
          data: { account_name: 'John Doe' },
        }),
      });

      // Mock successful Firestore storage
      const { setDoc } = await import('firebase/firestore');
      (setDoc as any).mockResolvedValueOnce(undefined);

      // Verify account
      const verifyResult = await verifyBankAccount('632005', '1234567890');
      expect(verifyResult.success).toBe(true);

      // Store account
      await storeBankAccount(
        'user123',
        '632005',
        'ABSA Bank',
        '1234567890',
        verifyResult.accountName!
      );

      expect(setDoc).toHaveBeenCalled();
    });

    it('should not store unverified account', async () => {
      // Mock failed Paystack verification
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({
          status: false,
          message: 'Invalid account',
        }),
      });

      const { setDoc } = await import('firebase/firestore');

      const verifyResult = await verifyBankAccount('632005', '9999999999');
      expect(verifyResult.success).toBe(false);

      // Should not attempt to store
      expect(setDoc).not.toHaveBeenCalled();
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle malformed API responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}), // Missing expected fields
      });

      const result = await verifyBankAccount('632005', '1234567890');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should handle timeout errors', async () => {
      (global.fetch as any).mockImplementationOnce(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      const result = await verifyBankAccount('632005', '1234567890');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Timeout');
    });

    it('should handle concurrent verification requests', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          status: true,
          data: { account_name: 'John Doe' },
        }),
      });

      const promises = [
        verifyBankAccount('632005', '1234567890'),
        verifyBankAccount('470010', '0987654321'),
        verifyBankAccount('250655', '1122334455'),
      ];

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });
});
