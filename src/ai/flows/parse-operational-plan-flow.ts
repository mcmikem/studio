
/**
 * @fileOverview An AI flow to parse an unstructured operational plan into structured Key Result data.
 * Uses OpenRouter for AI generation
 */

import { callOpenRouter, DEFAULT_MODEL } from '@/lib/openrouter';
import { aiConfig } from '@/lib/ai';
import type { ParsePlanInput, ParsePlanOutput } from '@/lib/types';
import { ParsePlanInputSchema, ParsePlanOutputSchema } from '@/lib/types';
import { z } from 'zod';

export async function parseOperationalPlan(input: ParsePlanInput): Promise<ParsePlanOutput> {
  const systemPrompt = `You are an expert M&E (Monitoring and Evaluation) assistant. Extract Key Results from NGO operational plans.`;

  const prompt = `You are an expert M&E (Monitoring and Evaluation) assistant. Your task is to read a raw text operational plan for an NGO and extract all the Key Results (KRs) into a structured JSON format.

Instructions:
1. Identify Key Results: Scan the text for items explicitly labeled with a KR code (e.g., "OCT-KR1", "NOV-KR1", "Q4-KR3").
2. Extract Details: For each KR found, extract:
   - title: The KR code (e.g., "OCT-KR1")
   - description: The short summary of the objective
   - target: The numerical goal (e.g., 2000000 for "2M UGX", 510 for "510 trees")
   - deadline: The specified end date in YYYY-MM-DD format
   - priority: 'High', 'Medium', or 'Low'
3. Set currentProgress to 0 for all new KRs.

Parse this operational plan:

${input.planText}

Return JSON: {"keyResults": [{"title": "", "description": "", "target": 0, "deadline": "YYYY-MM-DD", "priority": "Medium", "currentProgress": 0}]}`;

  if (aiConfig.provider === 'openrouter') {
    try {
      const text = await callOpenRouter(prompt, systemPrompt, DEFAULT_MODEL, 0.3);
      
      const jsonMatch = text.match(/\{"keyResults"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const sanitizedResults = (parsed.keyResults || []).map((kr: any) => ({ ...kr, currentProgress: 0 }));
        return { keyResults: sanitizedResults };
      }
      return { keyResults: [] };
    } catch (error) {
      console.error('Parse Operational Plan failed:', error);
      return { keyResults: [] };
    }
  }

  return { keyResults: [] };
}
