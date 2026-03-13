import 'server-only';
import { z } from 'zod';

// Get API key from environment - handle both server and client contexts
function getApiKey(): string {
  // Try different ways to get the API key
  if (typeof process !== 'undefined' && process.env) {
    return process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
  }
  return '';
}

const geminiApiKey = getApiKey();

export const aiConfig = {
  geminiApiKey,
  isConfigured: Boolean(geminiApiKey && geminiApiKey.startsWith('AIza')),
} as const;

// Log config status (only in server context)
if (typeof console !== 'undefined') {
  console.log('[AI Config] API Key configured:', aiConfig.isConfigured);
  if (!aiConfig.isConfigured) {
    console.warn('[AI Config] WARNING: Gemini API key not configured or invalid!');
  }
}
