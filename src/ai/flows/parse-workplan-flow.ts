
'use server';

/**
 * @fileOverview An AI flow to parse unstructured text into a structured weekly workplan.
 * Uses OpenRouter for AI generation
 */

import { callOpenRouter, DEFAULT_MODEL } from '@/lib/openrouter';
import { aiConfig } from '@/lib/ai';
import { ParseWorkplanInputSchema, ParseWorkplanOutputSchema, type ParseWorkplanInput, type ParseWorkplanOutput } from '@/lib/types';

export async function parseWorkplan(input: ParseWorkplanInput): Promise<ParseWorkplanOutput> {
  const systemPrompt = `You are an expert administrative assistant. Parse unstructured text into structured workplans.`;

  const prompt = `You are an expert administrative assistant. Your task is to read an unstructured block of text representing a team's weekly plan and convert it into a structured JSON format.

Instructions:
1. Extract Key Priorities: Identify each distinct task or activity.
2. Assign Priority: Based on keywords ("must do", "urgent", "critical" -> High; "should do", "important" -> Medium; "if time", "nice to have" -> Low)
3. Identify Responsible Parties: Look for names or roles. Return an array of strings.
4. Extract Deadlines: Format as YYYY-MM-DD if specified.
5. Create a concise summary as 'message'.

Parse this weekly plan:

${input.textPlan}

Return JSON with keyPriorities array and message string.`;

  if (aiConfig.provider === 'openrouter') {
    try {
      const text = await callOpenRouter(prompt, systemPrompt, DEFAULT_MODEL, 0.3);
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      }
      return { keyPriorities: [], message: 'Could not parse workplan' };
    } catch (error) {
      console.error('Parse workplan failed:', error);
      return { keyPriorities: [], message: 'Error parsing workplan' };
    }
  }

  return { keyPriorities: [], message: 'AI not configured' };
}
