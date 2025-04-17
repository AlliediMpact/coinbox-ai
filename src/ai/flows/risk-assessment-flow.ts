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
  }).optional().describe('The profile data of the user.'),
  creditScore: z.number().optional().describe('The user\'s credit score (if available).'),
  income: z.number().optional().describe('The user\'s monthly income (if available).'),
  employmentHistory: z.string().optional().describe('The user\'s employment history (if available).'),
  tradeType: z.string().describe('The type of trade (Borrow or Invest).'), // Add tradeType
  tradeAmount: z.number().describe('The amount of the trade.'), // Add tradeAmount
});
export type RiskAssessmentInput = z.infer<typeof RiskAssessmentInputSchema>;

const RiskAssessmentOutputSchema = z.object({
  riskScore: z.number().describe('The risk score based on the transaction history and user profile (0-100).'),
  explanation: z.string().describe('A detailed explanation of the risk score, including factors that influenced it.'),
});
export type RiskAssessmentOutput = z.infer<typeof RiskAssessmentOutputSchema>;

// Exported function to get the risk assessment
export async function getRiskAssessment(input: RiskAssessmentInput): Promise<RiskAssessmentOutput> {
  return riskAssessmentFlow(input);
}

// Define a tool to retrieve the user's credit score
const getUserCreditScore = ai.defineTool({
  name: 'getUserCreditScore',
  description: 'Retrieves the credit score of a user using their user ID from an external credit bureau.',
  inputSchema: z.object({
    userId: z.string().describe('The ID of the user to retrieve the credit score for.'),
  }),
  outputSchema: z.number().describe('The credit score of the user.')
}, async (input) => {
  // Placeholder implementation - replace with actual credit bureau API call
  console.log(`Calling external credit bureau for user ${input.userId}...`);
  // Simulate fetching credit score from an external API
  return new Promise((resolve) => {
    setTimeout(() => {
      const score = Math.floor(Math.random() * (850 - 300 + 1)) + 300; // Simulate a score between 300 and 850
      console.log(`Simulated credit score for user ${input.userId}: ${score}`);
      resolve(score);
    }, 1000); // Simulate API call delay
  });
});

// Define the prompt for the risk assessment
const prompt = ai.definePrompt({
  name: 'riskAssessmentPrompt',
  input: {
    schema: RiskAssessmentInputSchema,
  },
  output: {
    schema: RiskAssessmentOutputSchema,
  },
  prompt: `You are an AI assistant specialized in assessing the financial risk of users on a P2P lending platform. Your goal is to generate a risk score between 0 and 100 (lower score indicates lower risk) and provide a clear, concise explanation of the factors influencing the score.

  Follow these guidelines strictly:
  1. Scoring:
  - Start with a base score of 50.
  - Adjust the score based on the factors below, with a maximum possible increase or decrease of 25 points for each category.
  - Ensure the final score is within the range of 0 to 100.
  2. Explanation: Provide a succinct explanation for each adjustment made to the base score.
  3. Data Availability: If specific data is unavailable, clearly state the impact of missing information on the assessment and adjust the score conservatively.
  4. Credit Score:
  - If a credit score is provided, use it as a primary indicator of risk.
  - Excellent (750-850): -15 points
  - Good (700-749): -5 points
  - Fair (650-699): +5 points
  - Poor (300-649): +15 points
  - If no credit score is available, assign a neutral impact.
  5. Loan History:
  - No loan history: Neutral impact.
  - Positive history (all loans repaid on time): -10 points
  - Mixed history (some loans repaid, some defaulted): +10 points
  - Negative history (all loans defaulted): +20 points
  6. Active Investments:
  - Significant active investments (totaling more than tradeAmount): -5 points
  - No active investments: Neutral impact.
  7. Payment Behavior:
  - Consistently on-time payments: -10 points
  - Occasional missed payments: +5 points
  - Frequent missed payments: +15 points
  8. Transaction History:
  - High volume of transactions with a positive balance trend: -5 points
  - Low volume of transactions or a negative balance trend: +5 points
  9. User Profile:
  - Verified KYC status and high membership tier (Ambassador or Business): -5 points
  - Unverified KYC status or Basic membership: +5 points
  10. Income & Employment:
   - Stable employment history and verifiable income above a threshold: -5 points
   - Unstable employment history or unverifiable income: +5 points
  11. Trade Type & Amount:
   - Investing: -5 points
   - Borrowing with tradeAmount less than half of monthly income: -5 points
   - Borrowing with tradeAmount greater than monthly income: +10 points
  
  Here's the user ID: {{userId}}
  Type of Trade: {{tradeType}}
  Amount of Trade: {{tradeAmount}}

  Now, analyze the available data, calculate the risk score, and provide a detailed explanation. Consider the user's history, credit score, and the type and amount of the current trade. Provide the risk score as a number and the explanation as a string.
  
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

  {{#if income}}
  Income: {{income}}
  {{else}}
    - No income information provided.
  {{/if}}

  {{#if employmentHistory}}
  Employment History: {{employmentHistory}}
  {{else}}
    - No employment history provided.
  {{/if}}`,
    tools: [],
});

// Define the Genkit flow for risk assessment
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
    // If a credit score is not explicitly provided, try to fetch it using the tool.
    let creditScore: number | undefined = input.creditScore;
    try {
      if (!creditScore) {
        const creditScoreResult = await getUserCreditScore({ userId: input.userId });
        creditScore = creditScoreResult;
      }
    } catch (error) {
      console.error("Failed to retrieve credit score:", error);
      // Handle the error appropriately, e.g., set a default score or inform the user.
      creditScore = 600; // A default score in case of failure.
    }

    const augmentedInput = {
      ...input,
      creditScore,
    };

    const {output} = await prompt(augmentedInput);
    // Basic validation to ensure the output is within the expected range
    let riskScore = 50;
      if (output?.riskScore) {
        riskScore = Math.max(0, Math.min(100, Math.round(Number(output.riskScore))));
      }
    const explanation = output?.explanation || "No explanation available.";
    return {riskScore: riskScore, explanation: explanation};
  }
);

