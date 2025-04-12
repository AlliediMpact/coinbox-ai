'use server';
/**
 * @fileOverview An AI agent for assessing financial risk based on transaction history.
 *
 * - getRiskAssessment - A function that handles the risk assessment process.
 * - RiskAssessmentInput - The input type for the getRiskAssessment function.
 * - RiskAssessmentOutput - The return type for the getRiskAssessment function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const RiskAssessmentInputSchema = z.object({
  transactionHistory: z.string().describe('The transaction history of the user.'),
});
export type RiskAssessmentInput = z.infer<typeof RiskAssessmentInputSchema>;

const RiskAssessmentOutputSchema = z.object({
  riskScore: z.number().describe('The risk score based on the transaction history (0-100).'),
});
export type RiskAssessmentOutput = z.infer<typeof RiskAssessmentOutputSchema>;

export async function getRiskAssessment(input: RiskAssessmentInput): Promise<RiskAssessmentOutput> {
  return riskAssessmentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'riskAssessmentPrompt',
  input: {
    schema: z.object({
      transactionHistory: z.string().describe('The transaction history of the user.'),
    }),
  },
  output: {
    schema: z.object({
      riskScore: z.number().describe('The risk score based on the transaction history (0-100).'),
    }),
  },
  prompt: `You are an AI assistant that assesses financial risk based on user transaction history.
  Given the following transaction history, generate a risk score between 0 and 100.
  A lower score indicates lower risk, while a higher score indicates higher risk.

  Transaction History: {{{transactionHistory}}}

  Provide only the risk score as a number.`,
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
    return {riskScore: riskScore};
  }
);
