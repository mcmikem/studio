
/**
 * @fileOverview A development server for Genkit.
 *
 * This file is not intended to be modified.
 */

// Must be the first import
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

// This ensures all flows are registered with the central AI instance.
import { ai } from './genkit';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// By importing the flows, we ensure they are attached to the `ai` instance
// that the dev server will use.
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

// The 'ai' object is already configured in genkit.ts, so we just need to make
// sure it's loaded here. The Genkit CLI will pick it up automatically.
export default genkit({
  plugins: [googleAI({ apiVersion: 'v1' })],
});
