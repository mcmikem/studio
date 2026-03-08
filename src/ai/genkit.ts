
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { aiConfig } from '@/lib/ai';

export const ai = genkit({
  plugins: aiConfig.isConfigured ? [googleAI({ apiKey: aiConfig.geminiApiKey })] : [],
});
