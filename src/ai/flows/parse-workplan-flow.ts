
'use server';

/**
 * @fileOverview An AI flow to parse unstructured text into a structured weekly workplan.
 * Uses OpenRouter for AI generation
 */

import { callOpenRouter, DEFAULT_MODEL } from '@/lib/openrouter';
import { aiConfig } from '@/lib/ai';
import { ParseWorkplanInputSchema, ParseWorkplanOutputSchema, type ParseWorkplanInput, type ParseWorkplanOutput } from '@/lib/types';

import { ai } from '@/ai/genkit';

const workplanParserPrompt = ai.definePrompt({
  name: 'workplanParserPrompt',
  model: 'googleai/gemini-2.0-flash',
  system: `You are an expert administrative assistant. Parse unstructured text into structured workplans.`,
  output: {
    schema: ParseWorkplanOutputSchema
  }
});

export async function parseWorkplan(input: ParseWorkplanInput): Promise<ParseWorkplanOutput> {
  const prompt = `Convert this weekly plan into structured JSON with keyPriorities and a summary message:\n\n${input.textPlan}`;

  // 1. Try OpenRouter First
  if (aiConfig.provider === 'openrouter' && aiConfig.openRouterApiKey) {
    try {
      const systemPrompt = `You are an expert administrative assistant. Return valid JSON only.`;
      const text = await callOpenRouter(prompt, systemPrompt, DEFAULT_MODEL, 0.3);
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Parse workplan OpenRouter failed:', error);
    }
  }

  // 2. Try Gemini
  try {
    console.log('[ParseWorkplan] Attempting Gemini fallback');
    const response = await workplanParserPrompt({ input: prompt });
    if (response.output) {
       return response.output;
    }
  } catch (error) {
    console.error('Parse workplan Gemini failed:', error);
  }

  return { keyPriorities: [], message: 'AI and fallback failed to parse workplan' };
}
