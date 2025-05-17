'use server';

import { aiService } from '@/lib/ai-service';

export async function summarizeText(text: string) {
    return aiService.generateSummary(text);
}
