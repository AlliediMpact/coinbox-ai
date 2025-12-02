import { describe, it, expect } from 'vitest';
import { 
  validateAccountNumber,
  SOUTH_AFRICAN_BANKS 
} from '@/lib/bank-verification-service';

describe('Bank Verification Service - Unit Tests', () => {
  describe('validateAccountNumber', () => {
    it('should accept valid 9-digit account numbers', () => {
      expect(validateAccountNumber('123456789')).toBe(true);
    });

    it('should accept valid 10-digit account numbers', () => {
      expect(validateAccountNumber('1234567890')).toBe(true);
    });

    it('should accept valid 11-digit account numbers', () => {
      expect(validateAccountNumber('12345678901')).toBe(true);
    });

    it('should reject account numbers with less than 9 digits', () => {
      expect(validateAccountNumber('12345678')).toBe(false);
    });

    it('should reject account numbers with more than 11 digits', () => {
      expect(validateAccountNumber('123456789012')).toBe(false);
    });

    it('should reject account numbers with non-numeric characters', () => {
      expect(validateAccountNumber('12345abc90')).toBe(false);
    });

    it('should reject empty strings', () => {
      expect(validateAccountNumber('')).toBe(false);
    });

    it('should handle whitespace correctly', () => {
      expect(validateAccountNumber('  1234567890  ')).toBe(false);
    });
  });

  describe('SOUTH_AFRICAN_BANKS', () => {
    it('should contain Standard Bank', () => {
      const standardBank = SOUTH_AFRICAN_BANKS.find(
        (bank) => bank.name === 'Standard Bank'
      );
      expect(standardBank).toBeDefined();
      expect(standardBank?.code).toBe('051001');
    });

    it('should contain FNB', () => {
      const fnb = SOUTH_AFRICAN_BANKS.find(
        (bank) => bank.name === 'FNB (First National Bank)'
      );
      expect(fnb).toBeDefined();
      expect(fnb?.code).toBe('250655');
    });

    it('should contain all major South African banks', () => {
      expect(SOUTH_AFRICAN_BANKS.length).toBeGreaterThanOrEqual(10);
      
      const bankNames = SOUTH_AFRICAN_BANKS.map((bank) => bank.name);
      expect(bankNames).toContain('Standard Bank');
      expect(bankNames).toContain('FNB (First National Bank)');
      expect(bankNames).toContain('ABSA Bank');
      expect(bankNames).toContain('Nedbank');
      expect(bankNames).toContain('Capitec Bank');
    });

    it('should have valid Paystack bank codes for all banks', () => {
      SOUTH_AFRICAN_BANKS.forEach((bank) => {
        expect(bank.code).toBeDefined();
        expect(bank.code.length).toBeGreaterThan(0);
        expect(bank.paystackCode).toBeDefined();
        expect(typeof bank.paystackCode).toBe('string');
      });
    });
  });
});
