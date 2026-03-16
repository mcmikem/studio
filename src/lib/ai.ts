import 'server-only';

// Get API key from environment 
function getApiKey(): string {
  if (typeof process !== 'undefined' && process.env) {
    // Prefer OpenRouter if available
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    if (openrouterKey) return openrouterKey;
    
    // Fall back to Gemini
    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    return geminiKey;
  }
  return '';
}

const apiKey = getApiKey();

// Check if OpenRouter key (starts with sk-or-)
const isOpenRouter = Boolean(apiKey && apiKey.startsWith('sk-or-'));
// Check if Gemini key (starts with AIza)
const isGemini = Boolean(apiKey && apiKey.startsWith('AIza'));

export const aiConfig = {
  openRouterApiKey: isOpenRouter ? apiKey : '',
  geminiApiKey: isGemini ? apiKey : '',
  isConfigured: isOpenRouter || isGemini,
  provider: isOpenRouter ? 'openrouter' : isGemini ? 'gemini' : 'none',
} as const;

// Log for debugging
if (typeof window === 'undefined') {
  if (isOpenRouter) {
    console.log('[AI] OpenRouter API key configured - using free models');
  } else if (isGemini) {
    console.log('[AI] Gemini API key configured');
  } else {
    console.warn('[AI] API key NOT configured - AI features will use offline fallbacks');
  }
}
