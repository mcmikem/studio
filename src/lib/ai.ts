import 'server-only';

const geminiApiKey = process.env.GEMINI_API_KEY || '';

export const aiConfig = {
  geminiApiKey,
  isConfigured: Boolean(geminiApiKey),
} as const;
