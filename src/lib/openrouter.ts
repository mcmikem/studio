import OpenAI from 'openai';

function getOpenRouterClient(): OpenAI | null {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('[OpenRouter] No API key found in environment');
    return null;
  }
  return new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://omutofoundation.org',
      'X-Title': 'Omuto Central Studio',
    }
  });
}

export async function callOpenRouter(
  prompt: string,
  systemPrompt: string,
  model: string = DEFAULT_MODEL,
  temperature: number = 0.7
): Promise<string> {
  const client = getOpenRouterClient();
  if (!client) {
    throw new Error('OpenRouter not configured - missing API key');
  }

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature,
    });
    return response.choices[0]?.message?.content || '';
  } catch (error: any) {
    console.error('[OpenRouter] Error:', error?.message || error);
    throw error;
  }
}

export async function chatWithOpenRouter(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  model: string = DEFAULT_MODEL,
  temperature: number = 0.7
): Promise<string> {
  const client = getOpenRouterClient();
  if (!client) {
    throw new Error('OpenRouter not configured - missing API key');
  }

  try {
    const response = await client.chat.completions.create({
      model,
      messages,
      temperature,
    });
    return response.choices[0]?.message?.content || '';
  } catch (error: any) {
    console.error('[OpenRouter] Error:', error?.message || error);
    throw error;
  }
}

export const OPENROUTER_FREE_MODELS = [
  { id: 'google/gemini-2.0-flash-lite-preview-02-05:free', name: 'Gemini 2.0 Flash Lite', provider: 'Google', description: 'Best free model' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B', provider: 'Meta', description: 'Powerful open source' },
  { id: 'qwen/qwen-2.5-72b-instruct:free', name: 'Qwen 2.5 72B', provider: 'Alibaba', description: 'Strong multilingual' },
  { id: 'mistralai/mistral-small-3.1-24b-instruct:free', name: 'Mistral Small 3.1', provider: 'Mistral', description: 'Fast & capable' },
];

export const DEFAULT_MODEL = 'mistralai/mistral-small-3.1-24b-instruct:free';
