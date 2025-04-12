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

// Define a tool to fetch user transaction history
const getUserTransactionHistory = ai.defineTool({
  name: 'getUserTransactionHistory',
  description: 'Fetches the transaction history for a given user ID. Returns a list of transactions with type, amount, and date.',
  inputSchema: z.object({
    userId: z.string().describe('The ID of the user.'),
  }),
  outputSchema: z.array(z.object({
    type: z.string().describe('The type of transaction (e.g., Deposit, Withdrawal, Loan).'),
    amount: z.number().describe('The amount of the transaction.'),
    date: z.string().describe('The date of the transaction (YYYY-MM-DD).'),
  })).describe('The transaction history of the user.')
}, async (input) => {
  // Placeholder implementation - replace with actual data fetching logic
  console.log(`Fetching transaction history for user: ${input.userId}`);
  // Simulate fetching transaction history from a database or service
  const transactionHistory = [
    { type: "Deposit", amount: 1000, date: "2024-07-15" },
    { type: "Withdrawal", amount: 200, date: "2024-07-14" },
    { type: "Loan", amount: 300, date: "2024-07-12" }
  ];
  return transactionHistory;
});

// Define a tool to fetch user profile data (e.g., membership tier, KYC status)
const getUserProfile = ai.defineTool({
  name: 'getUserProfile',
  description: 'Fetches the profile data for a given user ID, including membership tier and KYC status. Returns membership and KYC status.',
  inputSchema: z.object({
    userId: z.string().describe('The ID of the user.'),
  }),
  outputSchema: z.object({
    membership: z.string().describe('The membership tier of the user (e.g., Basic, Ambassador).'),
    kycStatus: z.string().describe('The KYC status of the user (e.g., Verified, Pending).'),
  }).describe('The profile data of the user.')
}, async (input) => {
  // Placeholder implementation - replace with actual data fetching logic
  console.log(`Fetching profile for user: ${input.userId}`);
  // Simulate fetching user profile data
  return { membership: "Basic", kycStatus: "Verified" };
});

const getLoanHistory = ai.defineTool({
  name: 'getLoanHistory',
  description: 'Fetches the loan history for a given user ID. Returns a list of loans with amount and status.',
  inputSchema: z.object({
    userId: z.string().describe('The ID of the user.'),
  }),
  outputSchema: z.array(z.object({
    amount: z.number().describe('The amount of each loan.'),
    status: z.string().describe('The status of the loan (e.g., active, repaid, defaulted).'),
  })).describe('The loan history of the user.')
}, async (input) => {
  // Placeholder implementation - replace with actual data fetching logic
  console.log(`Fetching loan history for user: ${input.userId}`);
  // Simulate fetching loan history from a database or service
  const loanHistory = [
    { amount: 500, status: "repaid" },
    { amount: 1000, status: "active" },
  ];
  return loanHistory;
});

const getActiveInvestments = ai.defineTool({
  name: 'getActiveInvestments',
  description: 'Fetches the active investments for a given user ID. Returns a list of investments with amount and maturity date.',
  inputSchema: z.object({
    userId: z.string().describe('The ID of the user.'),
  }),
  outputSchema: z.array(z.object({
    amount: z.number().describe('The amount of each active investment.'),
    maturityDate: z.string().describe('The maturity date of the investment (YYYY-MM-DD).'),
  })).describe('The active investments of the user.')
}, async (input) => {
  // Placeholder implementation - replace with actual data fetching logic
  console.log(`Fetching active investments for user: ${input.userId}`);
  // Simulate fetching active investments from a database or service
  const activeInvestments = [
    { amount: 2000, maturityDate: "2024-12-31" },
    { amount: 500, maturityDate: "2025-06-30" },
  ];
  return activeInvestments;
});

const getPaymentBehavior = ai.defineTool({
  name: 'getPaymentBehavior',
  description: 'Fetches the payment behavior for a given user ID. Returns the number of on-time and missed payments.',
  inputSchema: z.object({
    userId: z.string().describe('The ID of the user.'),
  }),
  outputSchema: z.object({
    ontimePayments: z.number().describe('The number of on-time payments made by the user.'),
    missedPayments: z.number().describe('The number of missed payments by the user.'),
  }).describe('The payment behavior of the user.')
}, async (input) => {
  // Placeholder implementation - replace with actual data fetching logic
  console.log(`Fetching payment behavior for user: ${input.userId}`);
  // Simulate fetching payment behavior from a database or service
  return { ontimePayments: 10, missedPayments: 2 };
});

const prompt = ai.definePrompt({
  name: 'riskAssessmentPrompt',
  input: {
    schema: RiskAssessmentInputSchema,
  },
  output: {
    schema: RiskAssessmentOutputSchema,
  },
  prompt: `You are an AI assistant that assesses financial risk based on user transaction history and profile.
  Given the transaction history, loan history, active investments, payment behavior, and profile, generate a risk score between 0 and 100.
  A lower score indicates lower risk, while a higher score indicates higher risk.
  Provide a detailed explanation of the risk score, including the factors that influenced it.

  Here's the user ID: {{userId}}

  First, call the getUserTransactionHistory tool to get the transaction history.
  Then, call the getUserProfile tool to get the user profile.
  Then, call the getLoanHistory tool to get the loan history.
  Then, call the getActiveInvestments tool to get the active investments.
  Finally, call the getPaymentBehavior tool to get the payment behavior.

  Transaction History:
  {{#each (getUserTransactionHistory userId=userId)}}
  - Type: {{this.type}}, Amount: {{this.amount}}, Date: {{this.date}}
  {{/each}}

  User Profile:
  - Membership: {{(getUserProfile userId=userId).membership}}
  - KYC Status: {{(getUserProfile userId=userId).kycStatus}}

  Loan History:
  {{#each (getLoanHistory userId=userId)}}
  - Amount: {{this.amount}}, Status: {{this.status}}
  {{/each}}

  Active Investments:
  {{#each (getActiveInvestments userId=userId)}}
  - Amount: {{this.amount}}, Maturity Date: {{this.maturityDate}}
  {{/each}}

  Payment Behavior:
  - On-time Payments: {{(getPaymentBehavior userId=userId).ontimePayments}}
  - Missed Payments: {{(getPaymentBehavior userId=userId).missedPayments}}

  Based on the transaction history, user profile, loan history, active investments, and payment behavior, determine a risk score and explain your reasoning.
  Provide the risk score as a number and the explanation as a string.`,
  tools: [getUserTransactionHistory, getUserProfile, getLoanHistory, getActiveInvestments, getPaymentBehavior],
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
    const riskScore = Math.max(0, Math.min(100, Math.round(Number(output?.riskScore || 50))));
    const explanation = output?.explanation || "No explanation available.";
    return {riskScore: riskScore, explanation: explanation};
  }
);
