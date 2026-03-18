
'use server';

import { z } from 'zod';
import { callOpenRouter, DEFAULT_MODEL } from '@/lib/openrouter';
import { aiConfig } from '@/lib/ai';

import { ai } from '@/ai/genkit';

const StrategicAdvisorOutputSchema = z.object({
  insights: z.array(z.object({
    emoji: z.string(),
    title: z.string(),
    description: z.string(),
    recommendation: z.string()
  }))
});

const advisorPrompt = ai.definePrompt({
    name: 'advisorPrompt',
    model: 'googleai/gemini-2.0-flash',
    system: `You are an AI Strategic Advisor for the Omuto Foundation, a youth-led NGO in rural Uganda. 
Your user is the Executive Director.
Your task is to analyze the provided JSON data from the last 30 days and generate 3-4 high-level, actionable insights.
Do not state the obvious. Find trends, risks, and opportunities. Be direct and concise.`,
    output: {
        schema: StrategicAdvisorOutputSchema
    }
});

export async function getStrategicInsights(input: { activities?: any[]; checkins?: any[]; expenses?: any[]; keyResults?: any[] }) {
  const { activities = [], checkins = [], expenses = [], keyResults = [] } = input;
  
  console.log('[StrategicAdvisor] Starting analysis');

  const prompt = `
Analyze the last 30 days of data for Omuto Foundation:
- Key Results: ${JSON.stringify(keyResults).substring(0, 1000)}
- Activities: ${JSON.stringify(activities).substring(0, 1000)}
- Check-ins: ${JSON.stringify(checkins).substring(0, 1000)}
- Expenses: ${JSON.stringify(expenses).substring(0, 1000)}

Provide 3-4 strategic insights with emoji, title, description, and recommendation.
`;

  // 1. Try OpenRouter if configured
  if (aiConfig.provider === 'openrouter' && aiConfig.openRouterApiKey) {
    try {
      const systemPrompt = `You are an AI Strategic Advisor for Omuto Foundation. Return ONLY valid JSON.`;
      const text = await callOpenRouter(prompt, systemPrompt, DEFAULT_MODEL, 0.5);
      
      const jsonMatch = text?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
         return JSON.parse(jsonMatch[0]);
      }
    } catch (error: any) {
      console.error('[StrategicAdvisor] OpenRouter failed:', error?.message || error);
    }
  }

  // 2. Try Gemini (Genkit) if configured
  if (aiConfig.isConfigured) {
      try {
          console.log('[StrategicAdvisor] Attempting Gemini generation');
          const response = await advisorPrompt({ input: prompt });
          if (response.output) {
              return response.output;
          }
      } catch (error) {
          console.error('[StrategicAdvisor] Gemini failed:', error);
      }
  }

  // 3. Fallback if no AI is available
  return {
    insights: [
      {
        emoji: "⚙️",
        title: "AI Analysis Unavailable",
        description: "We couldn't reach the AI service to analyze your data.",
        recommendation: "Please ensure your API keys (Gemini or OpenRouter) are correctly configured in .env.local."
      }
    ]
  };
}
