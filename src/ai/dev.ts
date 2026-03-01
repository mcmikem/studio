
/**
 * @fileOverview A development server for Genkit.
 *
 * This file is not intended to be modified.
 */

// Must be the first import
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { getFirebaseAdmin } from '@/firebase/server';
import { ai } from './genkit';

// Ensure the admin instance is initialized and data is seeded on startup.
getFirebaseAdmin();


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
import './flows/strategic-advisor-flow';


export default ai;
