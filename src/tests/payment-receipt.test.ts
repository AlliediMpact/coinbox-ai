import { describe, test, expect, vi, beforeEach } from 'vitest';
import { receiptService } from '../lib/receipt-service';
import { notificationService } from '../lib/notification-service';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn(() => Promise.resolve({ id: 'receipt-123' })),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(() => Promise.resolve({
    exists: () => true,
    data: () => ({
      id: 'payment-123',
      userId: 'user-123',
      amount: 1000,
      currency: 'ZAR',
      status: 'paid'
    })
  })),
  getFirestore: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({
    empty: false,
    docs: [
      {
        id: 'receipt-123',
        data: () => ({
          paymentId: 'payment-123',
          userId: 'user-123',
          amount: 1000,
          currency: 'ZAR',
          date: new Date(),
          status: 'paid',
          description: 'Test Payment'
        })
      }
    ]
  })),
  serverTimestamp: vi.fn(() => new Date()),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn()
}));

// Mock notification service
vi.mock('../lib/notification-service', () => ({
  notificationService: {
    createNotification: vi.fn(() => Promise.resolve()),
    getUserNotifications: vi.fn()
  }
}));

// Mock PDF generator
vi.mock('../lib/pdf-generator', () => ({
  generatePDF: vi.fn(() => Promise.resolve('https://example.com/receipt-123.pdf'))
}));

describe('Receipt Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should generate a receipt for a valid payment', async () => {
    const result = await receiptService.generateReceipt({
      paymentId: 'payment-123',
      userId: 'user-123',
      amount: 1000,
      currency: 'ZAR',
      date: new Date(),
      description: 'Test Payment',
      status: 'paid'
    });

    expect(result).toBeDefined();
    expect(result.id).toBe('receipt-123');
    expect(notificationService.createNotification).toHaveBeenCalled();
  });

  test('should retrieve receipts for a user', async () => {
    const receipts = await receiptService.listUserReceipts('user-123');
    
    expect(receipts).toBeDefined();
    expect(receipts.length).toBeGreaterThan(0);
    expect(receipts[0].paymentId).toBe('payment-123');
  });
});
