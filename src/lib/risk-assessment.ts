// Risk assessment service for trading platform

interface RiskAssessmentInput {
    userId: string;
    counterpartyId: string;
    userProfile?: any;
    counterpartyProfile?: any;
}

interface RiskAssessmentResult {
    riskScore: number; // Scale of 0-100, higher = more risky
    riskLevel: 'low' | 'medium' | 'high' | 'extreme';
    factors: string[];
}

/**
 * Assess the risk of a transaction between two users
 * Uses historical data, user profiles, and trading patterns
 * 
 * @param input Assessment parameters
 * @returns Risk assessment result
 */
export async function getRiskAssessment(input: RiskAssessmentInput): Promise<RiskAssessmentResult> {
    // In a real application, this would use AI models, past transaction history,
    // fraud indicators, and other signals to determine risk
    
    // For now, we'll implement a simple algorithm
    const { userProfile, counterpartyProfile } = input;
    const factors: string[] = [];
    let riskScore = 0;
    
    // Factor 1: User verification level
    if (!userProfile?.emailVerified) {
        factors.push('User email not verified');
        riskScore += 20;
    }
    
    if (!userProfile?.kycStatus || userProfile?.kycStatus !== 'verified') {
        factors.push('User KYC not verified');
        riskScore += 20;
    }
    
    // Factor 2: Counterparty verification
    if (!counterpartyProfile?.emailVerified) {
        factors.push('Counterparty email not verified');
        riskScore += 20;
    }
    
    if (!counterpartyProfile?.kycStatus || counterpartyProfile?.kycStatus !== 'verified') {
        factors.push('Counterparty KYC not verified');
        riskScore += 20;
    }
    
    // Factor 3: Trading history (this would be expanded in production)
    const userTransactionCount = userProfile?.transactionCount || 0;
    if (userTransactionCount < 5) {
        factors.push('User has limited transaction history');
        riskScore += userTransactionCount === 0 ? 40 : 20;
    }
    
    // Determine risk level based on score
    let riskLevel: 'low' | 'medium' | 'high' | 'extreme';
    if (riskScore < 20) {
        riskLevel = 'low';
    } else if (riskScore < 50) {
        riskLevel = 'medium';
    } else if (riskScore < 80) {
        riskLevel = 'high';
    } else {
        riskLevel = 'extreme';
    }
    
    return {
        riskScore: Math.min(riskScore, 100), // Cap at 100
        riskLevel,
        factors
    };
}
