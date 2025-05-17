import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google AI model
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || '');

export class AIService {
  private model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  async generateSummary(text: string): Promise<{ summary: string }> {
    try {
      const prompt = `Please summarize the following text concisely and professionally:\n\n${text}`;
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return { summary: response.text() };
    } catch (error) {
      console.error('Error generating summary:', error);
      throw new Error('Failed to generate summary');
    }
  }
}

export const aiService = new AIService();
