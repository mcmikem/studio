
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Centralized AI configuration.
// It is now configured with the plugin and API key here.
export const ai = genkit({
    plugins: [
        googleAI({ apiKey: process.env.GEMINI_API_KEY }),
    ],
});
