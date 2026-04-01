import 'server-only';

function getOpenRouterKey(): string {
  if (process.env.OPENROUTER_API_KEY) {
    return process.env.OPENROUTER_API_KEY;
  }
  return '';
}

function getGeminiKey(): string {
  return process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
}

const openRouterKey = getOpenRouterKey();
const geminiKey = getGeminiKey();

const isOpenRouterConfigured = Boolean(openRouterKey && openRouterKey.startsWith('sk-or-'));
const isGeminiConfigured = Boolean(geminiKey && geminiKey.startsWith('AIza'));

export const aiConfig = {
  openRouterApiKey: openRouterKey,
  geminiApiKey: geminiKey,
  isConfigured: isOpenRouterConfigured || isGeminiConfigured,
  provider: isOpenRouterConfigured ? 'openrouter' : isGeminiConfigured ? 'gemini' : 'none',
} as const;
