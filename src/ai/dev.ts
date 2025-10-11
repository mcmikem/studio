
/**
 * @fileOverview A development server for Genkit.
 *
 * This file is not intended to be modified.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import { defineFlow, runFlow } from 'genkit/flow';

genkit({
  plugins: [googleAI()],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

// Make sure all flows are exported from here
export * from './flows/create-alert-flow';
export * from './flows/daily-planner-flow';
export * from './flows/impact-story-generator';
