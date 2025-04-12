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
  description: 'Fetches the transaction history for a given user ID.',
  inputSchema: z.object({
    userId: z.string().describe('The ID of the user.'),
  }),
  outputSchema: z.string().describe('The transaction history of the user.'),
}, async (input) => {
  // Placeholder implementation - replace with actual data fetching logic
  console.log(`Fetching transaction history for user: ${input.userId}`);
  // Simulate fetching transaction history from a database or service
  return `Simulated transaction history for user ${input.userId}:
    - Deposit: R1000
    - Withdrawal: R200
    - Loan: R300`;
});

// Define a tool to fetch user profile data (e.g., membership tier, KYC status)
const getUserProfile = ai.defineTool({
  name: 'getUserProfile',
  description: 'Fetches the profile data for a given user ID, including membership tier and KYC status.',
  inputSchema: z.object({
    userId: z.string().describe('The ID of the user.'),
  }),
  outputSchema: z.string().describe('The profile data of the user.'),
}, async (input) => {
  // Placeholder implementation - replace with actual data fetching logic
  console.log(`Fetching profile for user: ${input.userId}`);
  // Simulate fetching user profile data
  return `Simulated profile for user ${input.userId}:
    - Membership: Basic
    - KYC Status: Verified`;
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
      explanation: z.string().describe('A detailed explanation of the risk score, including factors that influenced it.'),
    }),
  },
  prompt: `You are an AI assistant that assesses financial risk based on user transaction history and profile.
  Given the transaction history and profile, generate a risk score between 0 and 100.
  A lower score indicates lower risk, while a higher score indicates higher risk.
  Provide a detailed explanation of the risk score, including the factors that influenced it.

  Transaction History: {{await getUserTransactionHistory userId=userId}}
  User Profile: {{await getUserProfile userId=userId}}

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
