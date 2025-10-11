
'use server';

/**
 * @fileOverview A development server for Genkit.
 *
 * This file is not intended to be modified.
 */

import {genkit} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';

genkit({
  plugins: [googleAI()],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

// Make sure all flows are exported from here
export * from './flows/assistant-flow';
export * from './flows/create-alert-flow';
export * from './flows/daily-planner-flow';
export * from './flows/impact-story-generator';
