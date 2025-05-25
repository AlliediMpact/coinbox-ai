import { receiptService } from '../lib/receipt-service';
import { notificationService } from '../lib/notification-service';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(() => Promise.resolve({ id: 'receipt-123' })),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({
    exists: () => true,
    data: () => ({
      id: 'payment-123',
      userId: 'user-123',
      amount: 1000,
      currency: 'ZAR',
      status: 'paid'
    })
  })),
  getDocs: jest.fn(() => Promise.resolve({
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
  serverTimestamp: jest.fn(() => new Date()),
  updateDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn()
}));

// Mock notification service
jest.mock('../lib/notification-service', () => ({
  notificationService: {
    createNotification: jest.fn(() => Promise.resolve()),
    getUserNotifications: jest.fn()
  }
}));

// Mock PDF generator
jest.mock('../lib/pdf-generator', () => ({
  generatePDF: jest.fn(() => Promise.resolve('https://example.com/receipt-123.pdf'))
}));

describe('Receipt Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    const receipts = await receiptService.getUserReceipts('user-123');
    
    expect(receipts).toBeDefined();
    expect(receipts.length).toBeGreaterThan(0);
    expect(receipts[0].paymentId).toBe('payment-123');
  });

  test('should generate PDF for receipt', async () => {
    const pdfUrl = await receiptService.generatePDF('receipt-123');
    
    expect(pdfUrl).toBe('https://example.com/receipt-123.pdf');
  });
});
