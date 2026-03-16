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
  });
}

export async function callOpenRouter(
  prompt: string,
  systemPrompt: string,
  model: string = 'openai/gpt-4o-mini',
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
  model: string = 'openai/gpt-4o-mini',
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
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', description: 'Best overall' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', description: 'Fast & capable' },
  { id: 'google/gemini-flash-1.5-8b', name: 'Gemini Flash 1.5', provider: 'Google', description: 'Free Google AI' },
  { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', provider: 'Meta', description: 'Open source' },
];

export const DEFAULT_MODEL = 'openai/gpt-4o-mini';
