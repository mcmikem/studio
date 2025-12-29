
import dotenv from 'dotenv';
dotenv.config();

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Initialize Genkit with the Google AI plugin.
// The API key is read from the GEMINI_API_KEY environment variable.

if (!process.env.GEMINI_API_KEY) {
    console.error("WARNING: GEMINI_API_KEY environment variable is not set. AI features will not work.");
}

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GEMINI_API_KEY }),
  ],
});
