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

// Import flows so they are registered with Genkit
import './flows/create-alert-flow';
import './flows/daily-planner-flow';
import './flows/impact-story-generator';
import './flows/omuto-ai-flow';
import './flows/smart-reminders-flow';
import './flows/qualitative-analysis-flow';
import './flows/generate-template-flow';
import './flows/testimony-processor-flow';
import './flows/grant-finder-flow';
import './flows/grant-writer-flow';
import './flows/parse-operational-plan-flow';
import './flows/parse-workplan-flow';

// Import tools so they are registered
import './tools/omuto-tools';


genkit({
  plugins: [googleAI()],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
