import { z } from 'zod';

export type MembershipTierType = 'Basic' | 'Ambassador' | 'VIP' | 'Business';

export interface MembershipTier {
  name: MembershipTierType;
  displayName: string;
  securityFee: number;
  refundableAmount: number;
  administrationFee: number;
  loanLimit: number;
  investmentLimit: number;
  commissionRate: number;
  transactionFee: number;
  color: string;
  benefits: string[];
}

export const MEMBERSHIP_TIERS: Record<MembershipTierType, MembershipTier> = {
  Basic: {
    name: 'Basic',
    displayName: 'Basic',
    securityFee: 550,
    refundableAmount: 500,
    administrationFee: 50,
    loanLimit: 500,
    investmentLimit: 5000,
    commissionRate: 1,
    transactionFee: 10,
    color: 'text-gray-600',
    benefits: [
      'Loan up to R500',
      'Invest up to R5,000',
      '1% referral commission',
      'Basic trading features'
    ]
  },
  Ambassador: {
    name: 'Ambassador',
    displayName: 'Ambassador',
    securityFee: 1100,
    refundableAmount: 1000,
    administrationFee: 100,
    loanLimit: 1000,
    investmentLimit: 10000,
    commissionRate: 2,
    transactionFee: 10,
    color: 'text-blue-600',
    benefits: [
      'Loan up to R1,000',
      'Invest up to R10,000',
      '2% referral commission',
      'Priority support'
    ]
  },
  VIP: {
    name: 'VIP',
    displayName: 'VIP',
    securityFee: 5500,
    refundableAmount: 5000,
    administrationFee: 500,
    loanLimit: 5000,
    investmentLimit: 50000,
    commissionRate: 3,
    transactionFee: 10,
    color: 'text-purple-600',
    benefits: [
      'Loan up to R5,000',
      'Invest up to R50,000',
      '3% referral commission',
      'VIP support & features'
    ]
  },
  Business: {
    name: 'Business',
    displayName: 'Business',
    securityFee: 11000,
    refundableAmount: 10000,
    administrationFee: 1000,
    loanLimit: 10000,
    investmentLimit: 100000,
    commissionRate: 5,
    transactionFee: 10,
    color: 'text-gold-600',
    benefits: [
      'Loan up to R10,000',
      'Invest up to R100,000',
      '5% referral commission',
      'Business dashboard & analytics'
    ]
  }
};

interface TierConfig {
  securityFee: number;
  refundable: number;
  loanLimit: number;
  investmentLimit: number;
  commission: number;
  txnFee: number;
  adminFee: number;
}

export const TIER_CONFIGS: Record<MembershipTierType, TierConfig> = {
  Basic: {
    securityFee: 550,
    refundable: 500,
    loanLimit: 500,
    investmentLimit: 5000,
    commission: 1,
    txnFee: 10,
    adminFee: 50
  },
  Ambassador: {
    securityFee: 1100,
    refundable: 1000,
    loanLimit: 1000,
    investmentLimit: 10000,
    commission: 2,
    txnFee: 10,
    adminFee: 100
  },
  VIP: {
    securityFee: 5500,
    refundable: 5000,
    loanLimit: 5000,
    investmentLimit: 50000,
    commission: 3,
    txnFee: 10,
    adminFee: 500
  },
  Business: {
    securityFee: 11000,
    refundable: 10000,
    loanLimit: 10000,
    investmentLimit: 100000,
    commission: 5,
    txnFee: 10,
    adminFee: 1000
  }
};

export const getTierConfig = (tier: MembershipTierType): TierConfig => {
  return TIER_CONFIGS[tier];
};

export const getMembershipTier = (tierName: string): MembershipTier => {
  const tier = MEMBERSHIP_TIERS[tierName as MembershipTierType];
  if (!tier) {
    return MEMBERSHIP_TIERS.Basic; // Default to Basic tier
  }
  return tier;
};

export const validateLoanAmount = (tier: MembershipTierType, amount: number): boolean => {
  return amount <= TIER_CONFIGS[tier].loanLimit;
};

export const validateInvestmentAmount = (tier: MembershipTierType, amount: number): boolean => {
  return amount <= TIER_CONFIGS[tier].investmentLimit;
};

export const calculateCommissionRate = (referrerTier: MembershipTierType): number => {
  const config = MEMBERSHIP_TIERS[referrerTier];
  return config.commissionRate;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0
  }).format(amount);
};