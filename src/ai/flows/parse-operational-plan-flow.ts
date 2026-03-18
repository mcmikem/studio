
/**
 * @fileOverview An AI flow to parse an unstructured operational plan into structured Key Result data.
 * Uses OpenRouter for AI generation
 */

import { callOpenRouter, DEFAULT_MODEL } from '@/lib/openrouter';
import { aiConfig } from '@/lib/ai';
import type { ParsePlanInput, ParsePlanOutput } from '@/lib/types';
import { ParsePlanInputSchema, ParsePlanOutputSchema } from '@/lib/types';
import { z } from 'zod';

import { ai } from '@/ai/genkit';

const parserPrompt = ai.definePrompt({
  name: 'parserPrompt',
  model: 'googleai/gemini-2.0-flash',
  system: `You are an expert M&E (Monitoring and Evaluation) assistant. Extract Key Results from NGO operational plans.`,
  output: {
    schema: ParsePlanOutputSchema
  }
});

export async function parseOperationalPlan(input: ParsePlanInput): Promise<ParsePlanOutput> {
  const prompt = `Extract Key Results from this operational plan:\n\n${input.planText}\n\nReturn JSON: {"keyResults": [{"title": "", "description": "", "target": 0, "deadline": "YYYY-MM-DD", "priority": "Medium", "currentProgress": 0}]}`;

  // 1. Try OpenRouter First
  if (aiConfig.provider === 'openrouter' && aiConfig.openRouterApiKey) {
    try {
      const systemPrompt = `You are an expert M&E assistant. Return valid JSON only.`;
      const text = await callOpenRouter(prompt, systemPrompt, DEFAULT_MODEL, 0.3);
      
      const jsonMatch = text.match(/\{"keyResults"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const sanitizedResults = (parsed.keyResults || []).map((kr: any) => ({ ...kr, currentProgress: 0 }));
        return { keyResults: sanitizedResults };
      }
    } catch (error) {
      console.error('Parse Operational Plan OpenRouter failed:', error);
    }
  }

  // 2. Try Gemini
  try {
    console.log('[ParseOperationalPlan] Attempting Gemini fallback');
    const response = await parserPrompt({ input: prompt });
    if (response.output) {
       const sanitizedResults = (response.output.keyResults || []).map((kr: any) => ({ ...kr, currentProgress: 0 }));
       return { keyResults: sanitizedResults };
    }
  } catch (error) {
    console.error('Parse Operational Plan Gemini failed:', error);
  }

  return { keyResults: [] };
}
