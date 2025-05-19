import { describe, expect, test } from '@jest/globals';
import { mockSuccessfulPayment, mockFailedPayment, createTestPaystackService } from './test-utils-impl';

describe('Test Utils', () => {
  test('mockSuccessfulPayment returns a valid payment response', () => {
    const payment = mockSuccessfulPayment();
    expect(payment.status).toBe(true);
    expect(payment.data.reference).toBeDefined();
    expect(payment.data.amount).toBe(55000);
  });

  test('mockFailedPayment returns a failed payment response', () => {
    const payment = mockFailedPayment();
    expect(payment.status).toBe(false);
    expect(payment.message).toBe('Payment failed');
  });

  test('createTestPaystackService creates a PaystackService instance', () => {
    const service = createTestPaystackService();
    expect(service).toBeDefined();
  });
});
