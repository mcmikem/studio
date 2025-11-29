
'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Centralized AI configuration
export const ai = genkit({
  plugins: [googleAI({ apiVersion: 'v1' })],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
