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

const prompt = ai.definePrompt({
  name: 'riskAssessmentPrompt',
  input: {
    schema: z.object({
      userId: z.string().describe('The ID of the user for whom to assess risk.'),
    }),
  },
  output: {
    schema: z.object({
      riskScore: z.number().describe('The risk score based on the transaction history and user profile (0-100).'),
      explanation: z.string().describe('A detailed explanation of the risk score, including the factors that influenced it.'),
    }),
  },
  prompt: `You are an AI assistant that assesses financial risk based on user transaction history and profile.
  Given the transaction history and profile, generate a risk score between 0 and 100.
  A lower score indicates lower risk, while a higher score indicates higher risk.
  Provide a detailed explanation of the risk score, including the factors that influenced it.

  First, call the getUserTransactionHistory tool to get the transaction history.
  Then, call the getUserProfile tool to get the user profile.

  Transaction History:
  {{#each (getUserTransactionHistory userId=userId)}}
  - Type: {{this.type}}, Amount: {{this.amount}}, Date: {{this.date}}
  {{/each}}

  User Profile:
  - Membership: {{(getUserProfile userId=userId).membership}}
  - KYC Status: {{(getUserProfile userId=userId).kycStatus}}

  Based on the transaction history and user profile, determine a risk score and explain your reasoning.
  Provide the risk score as a number and the explanation as a string.`,
  tools: [getUserTransactionHistory, getUserProfile],
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
