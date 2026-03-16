import OpenAI from 'openai';

const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

export async function chatWithOpenRouter(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  model: string = 'openai/gpt-4o-mini'
) {
  try {
    const response = await openrouter.chat.completions.create({
      model,
      messages,
    });
    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('[OpenRouter] Error:', error);
    throw error;
  }
}

export const OPENROUTER_FREE_MODELS = [
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic' },
  { id: 'google/gemini-flash-1.5', name: 'Gemini Flash 1.5', provider: 'Google' },
  { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', provider: 'Meta' },
];
