import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import axios from 'axios';

export interface BankDetails {
  accountNumber: string;
  bankCode: string;
  bankName: string;
  accountName?: string;
}

export interface BankVerificationResult {
  verified: boolean;
  accountName?: string;
  message: string;
}

// South African banks supported by Paystack
export const SOUTH_AFRICAN_BANKS = [
  { code: '632005', name: 'ABSA Bank' },
  { code: '470010', name: 'Capitec Bank' },
  { code: '250655', name: 'First National Bank (FNB)' },
  { code: '410506', name: 'Investec Bank' },
  { code: '198765', name: 'Nedbank' },
  { code: '051001', name: 'Standard Bank' },
  { code: '585274', name: 'African Bank' },
  { code: '462005', name: 'Bidvest Bank' },
  { code: '430000', name: 'Discovery Bank' },
  { code: '679000', name: 'TymeBank' },
];

class BankVerificationService {
  private readonly PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

  /**
   * Verify bank account using Paystack's Resolve Account API
   * This is the primary verification method - instant and reliable
   */
  async verifyBankAccount(
    userId: string,
    accountNumber: string,
    bankCode: string
  ): Promise<BankVerificationResult> {
    try {
      // Call Paystack Resolve Account API
      const response = await axios.get(
        `https://api.paystack.co/bank/resolve`,
        {
          params: {
            account_number: accountNumber,
            bank_code: bankCode,
          },
          headers: {
            Authorization: `Bearer ${this.PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      if (response.data.status && response.data.data) {
        const accountName = response.data.data.account_name;

        // Store verified bank account in Firestore
        await this.storeBankAccount(userId, {
          accountNumber,
          bankCode,
          bankName: this.getBankName(bankCode),
          accountName,
          verified: true,
          verifiedAt: Timestamp.now(),
          verificationMethod: 'paystack_api',
        });

        return {
          verified: true,
          accountName,
          message: 'Bank account verified successfully',
        };
      }

      return {
        verified: false,
        message: 'Could not verify bank account. Please check the details.',
      };
    } catch (error: any) {
      console.error('Bank verification error:', error);

      // Handle specific Paystack errors
      if (error.response?.data?.message) {
        return {
          verified: false,
          message: error.response.data.message,
        };
      }

      return {
        verified: false,
        message: 'An error occurred during verification. Please try again.',
      };
    }
  }

  /**
   * Store verified bank account in Firestore
   */
  private async storeBankAccount(userId: string, bankData: any): Promise<void> {
    const bankAccountRef = doc(db, 'bank_accounts', userId);

    await setDoc(bankAccountRef, {
      ...bankData,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Get user's verified bank account
   */
  async getBankAccount(userId: string): Promise<any | null> {
    const bankAccountRef = doc(db, 'bank_accounts', userId);
    const bankAccountDoc = await getDoc(bankAccountRef);

    if (bankAccountDoc.exists()) {
      return bankAccountDoc.data();
    }

    return null;
  }

  /**
   * Update bank account details
   */
  async updateBankAccount(
    userId: string,
    updates: Partial<BankDetails>
  ): Promise<void> {
    const bankAccountRef = doc(db, 'bank_accounts', userId);

    await updateDoc(bankAccountRef, {
      ...updates,
      updatedAt: Timestamp.now(),
      // Reset verification if account details change
      verified: false,
    });
  }

  /**
   * Delete bank account
   */
  async deleteBankAccount(userId: string): Promise<void> {
    const bankAccountRef = doc(db, 'bank_accounts', userId);

    await updateDoc(bankAccountRef, {
      deleted: true,
      deletedAt: Timestamp.now(),
    });
  }

  /**
   * Check if user has a verified bank account
   */
  async hasVerifiedBankAccount(userId: string): Promise<boolean> {
    const bankAccount = await this.getBankAccount(userId);
    return bankAccount?.verified === true;
  }

  /**
   * Get bank name from bank code
   */
  private getBankName(bankCode: string): string {
    const bank = SOUTH_AFRICAN_BANKS.find((b) => b.code === bankCode);
    return bank?.name || 'Unknown Bank';
  }

  /**
   * Validate South African account number format
   */
  validateAccountNumber(accountNumber: string): boolean {
    // SA account numbers are typically 9-11 digits
    const accountRegex = /^\d{9,11}$/;
    return accountRegex.test(accountNumber);
  }

  /**
   * Get list of supported banks
   */
  getSupportedBanks() {
    return SOUTH_AFRICAN_BANKS;
  }
}

export const bankVerificationService = new BankVerificationService();
