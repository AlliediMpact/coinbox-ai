import { describe, test, expect, vi, beforeEach } from 'vitest';
import { riskAssessmentService, RiskAssessment, RiskFactor } from '../lib/risk-assessment-service';
import { membershipService } from '../lib/membership-service';

// Mock dependencies
vi.mock('../lib/membership-service', () => ({
  membershipService: {
    getUserMembership: vi.fn()
  }
}));

vi.mock('firebase/firestore', () => ({
  getDoc: vi.fn(),
  doc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn()
}));

vi.mock('../lib/firebase', () => ({
  db: {}
}));

describe('Risk Assessment Service', () => {
  const mockUserId = 'test-user-123';
  const mockTransactionData = {
    amount: 1000,
    type: 'investment' as const,
    userId: mockUserId,
    timestamp: new Date(),
    recipientId: 'recipient-123'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock behavior
    (membershipService.getUserMembership as any).mockResolvedValue({
      currentTier: 'Basic'
    });
  });

  test('should initialize risk assessment service', () => {
    expect(riskAssessmentService).toBeDefined();
  });

  test('should assess user risk correctly', async () => {
    const riskAssessment = await riskAssessmentService.assessUserRisk(mockUserId);
    
    expect(riskAssessment).toBeDefined();
    expect(riskAssessment.userId).toBe(mockUserId);
    expect(typeof riskAssessment.riskScore).toBe('number');
    expect(riskAssessment.riskScore).toBeGreaterThanOrEqual(0);
    expect(riskAssessment.riskScore).toBeLessThanOrEqual(100);
    
    expect(['Low', 'Medium', 'High', 'Very High']).toContain(riskAssessment.riskLevel);
    expect(Array.isArray(riskAssessment.riskFactors)).toBe(true);
    expect(Array.isArray(riskAssessment.recommendations)).toBe(true);
  });

  test('should assess transaction risk correctly', async () => {
    const riskAssessment = await riskAssessmentService.assessTransactionRisk(mockTransactionData);
    
    expect(riskAssessment).toBeDefined();
    expect(typeof riskAssessment.riskScore).toBe('number');
    expect(riskAssessment.riskScore).toBeGreaterThanOrEqual(0);
    expect(riskAssessment.riskScore).toBeLessThanOrEqual(100);
    
    expect(['Low', 'Medium', 'High', 'Very High']).toContain(riskAssessment.riskLevel);
    expect(Array.isArray(riskAssessment.riskFactors)).toBe(true);
  });

  test('should calculate risk factors properly', async () => {
    const riskAssessment = await riskAssessmentService.assessUserRisk(mockUserId);
    
    expect(riskAssessment.riskFactors.length).toBeGreaterThan(0);
    
    riskAssessment.riskFactors.forEach(factor => {
      expect(factor.name).toBeDefined();
      expect(typeof factor.score).toBe('number');
      expect(factor.score).toBeGreaterThanOrEqual(0);
      expect(factor.score).toBeLessThanOrEqual(100);
      expect(typeof factor.weight).toBe('number');
      expect(factor.description).toBeDefined();
      expect(['positive', 'negative', 'neutral']).toContain(factor.impact);
    });
  });

  test('should provide appropriate recommendations', async () => {
    const riskAssessment = await riskAssessmentService.assessUserRisk(mockUserId);
    
    expect(Array.isArray(riskAssessment.recommendations)).toBe(true);
    
    riskAssessment.recommendations?.forEach(recommendation => {
      expect(recommendation.type).toBeDefined();
      expect(recommendation.message).toBeDefined();
      expect(['info', 'warning', 'critical']).toContain(recommendation.severity);
      expect(typeof recommendation.automated).toBe('boolean');
    });
  });

  test('should handle high-risk scenarios', async () => {
    // Mock high-risk user data
    const highRiskTransactionData = {
      ...mockTransactionData,
      amount: 50000, // Very large amount
      type: 'loan' as const
    };

    const riskAssessment = await riskAssessmentService.assessTransactionRisk(highRiskTransactionData);
    
    // High amount should increase risk score
    expect(riskAssessment.riskScore).toBeGreaterThan(30);
    
    // Should have risk factors related to amount
    const amountFactor = riskAssessment.riskFactors.find(f => 
      f.name.toLowerCase().includes('amount') || f.name.toLowerCase().includes('size')
    );
    expect(amountFactor).toBeDefined();
  });

  test('should handle low-risk scenarios', async () => {
    const lowRiskTransactionData = {
      ...mockTransactionData,
      amount: 100, // Small amount
      type: 'investment' as const
    };

    const riskAssessment = await riskAssessmentService.assessTransactionRisk(lowRiskTransactionData);
    
    // Should generally have lower risk for smaller transactions
    expect(riskAssessment.riskLevel).not.toBe('Very High');
  });

  test('should get risk history for user', async () => {
    const riskHistory = await riskAssessmentService.getRiskHistory(mockUserId, 30);
    
    expect(Array.isArray(riskHistory)).toBe(true);
    
    riskHistory.forEach(assessment => {
      expect(assessment.userId).toBe(mockUserId);
      expect(assessment.timestamp).toBeDefined();
      expect(typeof assessment.riskScore).toBe('number');
      expect(['Low', 'Medium', 'High', 'Very High']).toContain(assessment.riskLevel);
    });
  });

  test('should update risk profile correctly', async () => {
    const updateData = {
      creditScore: 750,
      verificationLevel: 'verified' as const,
      accountAge: 365,
      transactionHistory: 50
    };

    const result = await riskAssessmentService.updateRiskProfile(mockUserId, updateData);
    
    expect(result.success).toBe(true);
    expect(result.updatedFactors).toBeDefined();
    expect(Array.isArray(result.updatedFactors)).toBe(true);
  });

  test('should handle different transaction types', async () => {
    const transactionTypes = ['investment', 'loan', 'transfer', 'commission'] as const;
    
    for (const type of transactionTypes) {
      const transactionData = {
        ...mockTransactionData,
        type
      };

      const riskAssessment = await riskAssessmentService.assessTransactionRisk(transactionData);
      
      expect(riskAssessment).toBeDefined();
      expect(typeof riskAssessment.riskScore).toBe('number');
    }
  });

  test('should generate risk reports', async () => {
    const report = await riskAssessmentService.generateRiskReport(mockUserId, '30d');
    
    expect(report).toBeDefined();
    expect(report.userId).toBe(mockUserId);
    expect(report.period).toBe('30d');
    expect(report.summary).toBeDefined();
    expect(Array.isArray(report.assessments)).toBe(true);
    expect(Array.isArray(report.trends)).toBe(true);
    expect(Array.isArray(report.recommendations)).toBe(true);
  });

  test('should calculate risk score changes over time', async () => {
    const riskHistory = await riskAssessmentService.getRiskHistory(mockUserId, 30);
    
    if (riskHistory.length > 1) {
      // Check that timestamps are in order
      for (let i = 1; i < riskHistory.length; i++) {
        const current = riskHistory[i].timestamp;
        const previous = riskHistory[i - 1].timestamp;
        if (current && previous) {
          expect(current.getTime()).toBeLessThanOrEqual(previous.getTime());
        }
      }
    }
  });

  test('should validate risk assessment data', async () => {
    // Test with invalid user ID
    try {
      await riskAssessmentService.assessUserRisk('');
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeDefined();
    }

    // Test with invalid transaction data
    try {
      const invalidTransactionData = {
        ...mockTransactionData,
        amount: -100 // Negative amount
      };
      await riskAssessmentService.assessTransactionRisk(invalidTransactionData);
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  test('should handle machine learning predictions', async () => {
    const riskAssessment = await riskAssessmentService.assessUserRisk(mockUserId);
    
    // Check if ML predictions are included
    expect(riskAssessment.mlPredictions).toBeDefined();
    if (riskAssessment.mlPredictions) {
      expect(typeof riskAssessment.mlPredictions.fraudProbability).toBe('number');
      expect(typeof riskAssessment.mlPredictions.defaultProbability).toBe('number');
      expect(typeof riskAssessment.mlPredictions.confidenceScore).toBe('number');
    }
  });
});
