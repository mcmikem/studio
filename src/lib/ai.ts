import 'server-only';
import { cache } from 'react';

// Get API key from environment - cached for performance
const getApiKey = cache(() => {
  // Try to get the API key from environment
  if (process.env.OPENROUTER_API_KEY) {
    return process.env.OPENROUTER_API_KEY;
  }
  return '';
});

const apiKey = getApiKey();

// Check if OpenRouter key (starts with sk-or-)
const isOpenRouter = Boolean(apiKey && apiKey.startsWith('sk-or-'));
// Check if Gemini key (starts with AIza)
const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const isGemini = Boolean(geminiKey && geminiKey.startsWith('AIza'));

export const aiConfig = {
  openRouterApiKey: isOpenRouter ? apiKey : '',
  geminiApiKey: isGemini ? geminiKey : '',
  isConfigured: isOpenRouter || isGemini,
  provider: isOpenRouter ? 'openrouter' : isGemini ? 'gemini' : 'none',
} as const;

// Log for debugging - only on server
if (typeof window === 'undefined') {
  if (isOpenRouter) {
    console.log('[AI] OpenRouter API key configured - using free models');
  } else if (isGemini) {
    console.log('[AI] Gemini API key configured');
  } else {
    console.warn('[AI] API key NOT configured - AI features will use offline fallbacks');
    console.warn('[AI] Check OPENROUTER_API_KEY in environment');
  }
}
