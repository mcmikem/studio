
/**
 * @fileOverview A development server for Genkit.
 *
 * This file is not intended to be modified.
 */
import * as fs from 'fs';
import * as path from 'path';

// Must be the first import
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

// Manually load the service account key and set it as an environment variable
const serviceAccountPath = path.resolve(process.cwd(), 'secrets/serviceAccountKey.json');
if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = fs.readFileSync(serviceAccountPath, 'utf-8');
    process.env.FIREBASE_SERVICE_ACCOUNT = serviceAccount;
    console.log('Firebase service account loaded successfully.');
  } catch (error) {
    console.error('Failed to read service account key:', error);
    process.exit(1);
  }
} else {
    console.warn('Service account key not found at secrets/serviceAccountKey.json. Server-side flows may fail.');
}


import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import { defineGcpAuth } from '@genkit-ai/google-genai/auth';
import {v2} from '@google-cloud/translate';
import {google} from 'googleapis';
import wav from 'wav';
import { initializeFirebase } from '@/firebase/server';

// Initialize Firebase Admin SDK first
initializeFirebase();

genkit({
  plugins: [googleAI()],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

// Make sure all flows are exported from here.
// Note: We only export the functions themselves, not the Genkit flow objects.
export { createAlert } from './flows/create-alert-flow';
export { dailyPlannerAI } from './flows/daily-planner-flow';
export { generateImpactStory } from './flows/impact-story-generator';
export { omutoAIFlow } from './flows/omuto-ai-flow';
export { generateSmartReminders } from './flows/smart-reminders-flow';
export { findGrants } from './flows/grant-finder-flow';
export { writeConceptNote } from './flows/grant-writer-flow';
export { searchOmuto } from './flows/global-search-flow';
export { parseWorkplan } from './flows/parse-workplan-flow';
export { processTestimony } from './flows/testimony-processor-flow';
export { analyzeProgramQualitativeData } from './flows/qualitative-analysis-flow';


// NOTE: omuto-tools now only contains server-side safe tools.
export * from './tools/omuto-tools';
    
