
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
import { firestore } from '@/firebase/server';

genkit({
  plugins: [googleAI()],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

// Make sure all flows are exported from here.
// Note: We only export the functions themselves, not the Genkit flow objects.
export * from './flows/create-alert-flow';
export * from './flows/daily-planner-flow';
export * from './flows/impact-story-generator';
export * from './flows/omuto-ai-flow';
export * from './flows/smart-reminders-flow';
export * from './flows/qualitative-analysis-flow';
export * from './flows/generate-template-flow';
export * from './flows/testimony-processor-flow';


// NOTE: omuto-tools now only contains server-side safe tools.
export * from './tools/omuto-tools';
