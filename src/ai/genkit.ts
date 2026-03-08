
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { aiConfig } from '@/lib/ai';

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: aiConfig.geminiApiKey }),
  ],
  // ... other configurations
});
