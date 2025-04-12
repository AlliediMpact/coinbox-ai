'use server';
/**
 * @fileOverview An AI agent for assessing financial risk based on transaction history and user profile.
 *
 * - getRiskAssessment - A function that handles the risk assessment process.
 * - RiskAssessmentInput - The input type for the getRiskAssessment function.
 * - RiskAssessmentOutput - The return type for the getRiskAssessment function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const RiskAssessmentInputSchema = z.object({
  userId: z.string().describe('The ID of the user for whom to assess risk.'),
  loanHistory: z.array(z.object({
    amount: z.number().describe('The amount of each loan.'),
    status: z.string().describe('The status of the loan (e.g., active, repaid, defaulted).'),
  })).optional().describe('The loan history of the user.'),
  activeInvestments: z.array(z.object({
    amount: z.number().describe('The amount of each active investment.'),
    maturityDate: z.string().describe('The maturity date of the investment (YYYY-MM-DD).'),
  })).optional().describe('The active investments of the user.'),
  paymentBehaviour: z.object({
    ontimePayments: z.number().describe('The number of on-time payments made by the user.'),
    missedPayments: z.number().describe('The number of missed payments by the user.'),
  }).optional().describe('The payment behavior of the user.'),
  transactionHistory: z.array(z.object({
    type: z.string().describe('The type of transaction (e.g., Deposit, Withdrawal, Loan).'),
    amount: z.number().describe('The amount of the transaction.'),
    date: z.string().describe('The date of the transaction (YYYY-MM-DD).'),
  })).optional().describe('The transaction history of the user.'),
  userProfile: z.object({
    membership: z.string().describe('The membership tier of the user (e.g., Basic, Ambassador).'),
    kycStatus: z.string().describe('The KYC status of the user (e.g., Verified, Pending).'),
  }).optional().describe('The profile data of the user.')
});
export type RiskAssessmentInput = z.infer<typeof RiskAssessmentInputSchema>;

const RiskAssessmentOutputSchema = z.object({
  riskScore: z.number().describe('The risk score based on the transaction history and user profile (0-100).'),
  explanation: z.string().describe('A detailed explanation of the risk score, including factors that influenced it.'),
});
export type RiskAssessmentOutput = z.infer<typeof RiskAssessmentOutputSchema>;

export async function getRiskAssessment(input: RiskAssessmentInput): Promise<RiskAssessmentOutput> {
  return riskAssessmentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'riskAssessmentPrompt',
  input: {
    schema: RiskAssessmentInputSchema,
  },
  output: {
    schema: RiskAssessmentOutputSchema,
  },
  prompt: `You are an AI assistant that assesses financial risk based on user data.
  Given the user data, generate a risk score between 0 and 100.
  A lower score indicates lower risk, while a higher score indicates higher risk.
  Provide a detailed explanation of the risk score, including the factors that influenced it.
  
  Here's the user ID: {{userId}}

  Analyze available data, calculate the risk score, and provide a detailed explanation.
  If specific data is unavailable, adjust the score accordingly, explaining the impact of missing information on the assessment.
  
  Transaction History:
  {{#if loanHistory}}
  Loan History:
    {{#each loanHistory}}
      - Amount: {{this.amount}}, Status: {{this.status}}
    {{/each}}
  {{else}}
    - No loan history available.
  {{/if}}

  Active Investments:
  {{#if activeInvestments}}
    {{#each activeInvestments}}
      - Amount: {{this.amount}}, Maturity Date: {{this.maturityDate}}
    {{/each}}
  {{else}}
    - No active investments available.
  {{/if}}

  Payment Behavior:
  {{#if paymentBehaviour}}
    - On-time Payments: {{paymentBehaviour.ontimePayments}}
    - Missed Payments: {{paymentBehaviour.missedPayments}}
  {{else}}
    - No payment behavior available.
  {{/if}}

  Transaction History:
  {{#if transactionHistory}}
    {{#each transactionHistory}}
      - Type: {{this.type}}, Amount: {{this.amount}}, Date: {{this.date}}
    {{/each}}
  {{else}}
    - No transaction history available.
  {{/if}}

  User Profile:
  {{#if userProfile}}
    - Membership: {{userProfile.membership}}
    - KYC Status: {{userProfile.kycStatus}}
  {{else}}
    - No user profile available.
  {{/if}}

  Based on the available user data, determine a risk score and explain your reasoning.
  Provide the risk score as a number and the explanation as a string.`,
  tools: [],
});

const riskAssessmentFlow = ai.defineFlow<
  typeof RiskAssessmentInputSchema,
  typeof RiskAssessmentOutputSchema
>(
  {
    name: 'riskAssessmentFlow',
    inputSchema: RiskAssessmentInputSchema,
    outputSchema: RiskAssessmentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // Basic validation to ensure the output is within the expected range
    let riskScore = 50;
      if (output?.riskScore) {
        riskScore = Math.max(0, Math.min(100, Math.round(Number(output.riskScore))));
      }
    const explanation = output?.explanation || "No explanation available.";
    return {riskScore: riskScore, explanation: explanation};
  }
);
