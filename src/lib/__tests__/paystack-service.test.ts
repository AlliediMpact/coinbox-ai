import { paystackService } from '../paystack-service';
import axios from 'axios';
import { MEMBERSHIP_TIERS } from '../membership-tiers';
import { resetAdminCache } from '../admin-bridge';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Define mocks
const mockAdminDb = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    set: jest.fn().mockResolvedValue(true),
    update: jest.fn().mockResolvedValue(true)
};

const mockFieldValue = {
    serverTimestamp: jest.fn(),
    increment: jest.fn()
};

// Inject mocks into global scope for admin-bridge to pick up
(globalThis as any).adminDb = mockAdminDb;
(globalThis as any).FieldValue = mockFieldValue;

describe('PaystackService', () => {
    const mockUserId = 'test-user-123';
    const mockEmail = 'test@example.com';
    const mockAmount = 550; // Basic tier security fee
    const mockReference = 'test-ref-123';

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:9004';
        
        // Ensure globals are set before each test
        (globalThis as any).adminDb = mockAdminDb;
        (globalThis as any).FieldValue = mockFieldValue;
        resetAdminCache();
    });

    afterAll(() => {
        delete (globalThis as any).adminDb;
        delete (globalThis as any).FieldValue;
    });

    describe('initializePayment', () => {
        const mockPaymentResponse = {
            status: true,
            message: 'Authorization URL created',
            data: {
                authorization_url: 'https://checkout.paystack.com/test',
                access_code: 'test_code',
                reference: mockReference
            }
        };

        it('should initialize payment for valid membership tier', async () => {
            mockedAxios.post.mockResolvedValueOnce({ data: mockPaymentResponse });

            const result = await paystackService.initializePayment(
                mockUserId,
                mockEmail,
                mockAmount,
                {
                    membershipTier: 'Basic',
                    metadata: {
                        securityFee: 550,
                        refundableAmount: 500,
                        administrationFee: 50
                    }
                }
            );

            expect(result).toEqual(mockPaymentResponse);
            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    email: mockEmail,
                    amount: mockAmount * 100,
                    metadata: expect.objectContaining({
                        userId: mockUserId,
                        payment_type: 'membership_fee'
                    })
                }),
                expect.any(Object)
            );
        });

        it('should reject payment with invalid amount for tier', async () => {
            await expect(
                paystackService.initializePayment(
                    mockUserId,
                    mockEmail,
                    1000, // Wrong amount for Basic tier
                    {
                        membershipTier: 'Basic',
                        metadata: {
                            securityFee: 550,
                            refundableAmount: 500,
                            administrationFee: 50
                        }
                    }
                )
            ).rejects.toThrow('Invalid payment amount for selected membership tier');
        });

        it('should log payment attempt in database', async () => {
            mockedAxios.post.mockResolvedValueOnce({ data: mockPaymentResponse });

            await paystackService.initializePayment(
                mockUserId,
                mockEmail,
                mockAmount,
                {
                    membershipTier: 'Basic'
                }
            );

            expect(mockAdminDb.collection).toHaveBeenCalledWith('payments');
            expect(mockAdminDb.doc).toHaveBeenCalledWith(mockReference);
            expect(mockAdminDb.set).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: mockUserId,
                    amount: mockAmount,
                    email: mockEmail,
                    status: 'initiated'
                })
            );
        });
    });

    describe('verifyPayment', () => {
        const mockVerifyResponse = {
            status: true,
            message: 'Verification successful',
            data: {
                status: 'success',
                reference: mockReference,
                amount: mockAmount * 100,
                customer: {
                    email: mockEmail
                }
            }
        };

        it('should verify successful payment', async () => {
            mockedAxios.get.mockResolvedValueOnce({ data: mockVerifyResponse });

            const result = await paystackService.verifyPayment(mockReference);

            expect(result).toEqual({
                success: true,
                data: mockVerifyResponse.data
            });
            expect(mockAdminDb.collection).toHaveBeenCalledWith('payments');
            expect(mockAdminDb.doc).toHaveBeenCalledWith(mockReference);
            expect(mockAdminDb.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'success'
                })
            );
        });

        it('should handle failed payment verification', async () => {
            const failedResponse = {
                ...mockVerifyResponse,
                data: { ...mockVerifyResponse.data, status: 'failed' }
            };
            mockedAxios.get.mockResolvedValueOnce({ data: failedResponse });

            const result = await paystackService.verifyPayment(mockReference);

            expect(result).toEqual({
                success: false,
                error: expect.any(String)
            });
            expect(mockAdminDb.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'failed'
                })
            );
        });

        it('should handle network errors during verification', async () => {
            mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

            const result = await paystackService.verifyPayment(mockReference);

            expect(result).toEqual({
                success: false,
                error: 'Payment verification failed'
            });
        });
    });
});
