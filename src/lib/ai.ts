import 'server-only';

// Get API key from environment 
function getApiKey(): string {
  // Try to get the API key from environment
  if (typeof process !== 'undefined' && process.env) {
    const key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    return key;
  }
  return '';
}

const geminiApiKey = getApiKey();

// Check if API key is valid (starts with AIza)
const isValidKey = Boolean(geminiApiKey && geminiApiKey.startsWith('AIza'));

export const aiConfig = {
  geminiApiKey: isValidKey ? geminiApiKey : '',
  isConfigured: isValidKey,
} as const;

// Log for debugging
if (typeof window === 'undefined') {
  // Only log on server
  if (isValidKey) {
    console.log('[AI] Gemini API key configured');
  } else {
    console.warn('[AI] Gemini API key NOT configured - AI features will use offline fallbacks');
  }
}
