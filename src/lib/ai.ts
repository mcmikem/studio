import 'server-only';

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  throw new Error('Missing GEMINI_API_KEY environment variable.');
}

export const aiConfig = {
  geminiApiKey,
} as const;
