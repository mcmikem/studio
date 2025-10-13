
/**
 * @fileOverview A development server for Genkit.
 *
 * This file is not intended to be modified.
 */

// Must be the first import
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

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
export * from './flows/omuto-ai-flow';
export * from './flows/smart-reminders-flow';
export * from './flows/grant-finder-flow';
export * from './flows/grant-writer-flow';
// NOTE: omuto-tools now only contains server-side safe tools.
export * from './tools/omuto-tools';
