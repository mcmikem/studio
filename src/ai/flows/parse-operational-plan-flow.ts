
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

const TIMEOUT_MS = 30000;

const parserPrompt = ai.definePrompt({
  name: 'parserPrompt',
  model: 'googleai/gemini-2.0-flash',
  system: `You are an expert M&E (Monitoring and Evaluation) assistant. Extract Key Results from NGO operational plans.`,
  output: {
    schema: ParsePlanOutputSchema
  }
});

function withTimeout<T>(promise: Promise<T>, ms: number, operationName: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`${operationName} timed out after ${ms}ms`)), ms)
    )
  ]);
}

function extractJSON(text: string): object | null {
  const patterns = [
    /\{[\s\S]*"keyResults"[\s\S]*\}/,
    /\{[\s\S]*"keyResults":\s*\[[\s\S]*\][\s\S]*\}/,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        continue;
      }
    }
  }
  
  try {
    const parsed = JSON.parse(text);
    if (parsed.keyResults) return parsed;
  } catch {
    return null;
  }
  
  return null;
}

function sanitizeKeyResult(kr: any, index: number): any {
  return {
    title: String(kr.title || `KR${index + 1}`).substring(0, 200),
    description: String(kr.description || '').substring(0, 500),
    target: Number(kr.target) || 0,
    deadline: String(kr.deadline || '').substring(0, 10),
    priority: ['High', 'Medium', 'Low'].includes(kr.priority) ? kr.priority : 'Medium',
    currentProgress: 0,
  };
}

export async function parseOperationalPlan(input: ParsePlanInput): Promise<ParsePlanOutput> {
  const validation = ParsePlanInputSchema.safeParse(input);
  if (!validation.success) {
    throw new Error('Invalid input: ' + validation.error.message);
  }

  const prompt = `Extract Key Results from this operational plan. Return ONLY valid JSON:

${input.planText}

Format required:
{"keyResults": [{"title": "KR name", "description": "details", "target": 100, "deadline": "2024-12-31", "priority": "High"}]}`;

  let lastError = '';

  // 1. Try OpenRouter First
  if (aiConfig.provider === 'openrouter' && aiConfig.openRouterApiKey) {
    try {
      console.log('[parseOperationalPlan] Attempting OpenRouter...');
      const systemPrompt = `You are an expert M&E assistant. Return ONLY valid JSON. No markdown, no explanations.`;
      const text = await withTimeout(
        callOpenRouter(prompt, systemPrompt, DEFAULT_MODEL, 0.2),
        TIMEOUT_MS,
        'OpenRouter'
      );
      
      const extracted = extractJSON(text);
      if (extracted && 'keyResults' in extracted && Array.isArray((extracted as any).keyResults)) {
        console.log(`[parseOperationalPlan] OpenRouter success: ${(extracted as any).keyResults.length} KRs`);
        const sanitizedResults = (extracted as any).keyResults.map((kr: any, i: number) => sanitizeKeyResult(kr, i));
        return { keyResults: sanitizedResults };
      }
      lastError = 'Could not parse JSON from response';
    } catch (error: any) {
      lastError = error.message;
      console.error('[parseOperationalPlan] OpenRouter failed:', lastError);
    }
  }

  // 2. Try Gemini fallback
  if (aiConfig.geminiApiKey) {
    try {
      console.log('[parseOperationalPlan] Attempting Gemini fallback...');
      const response = await withTimeout(
        parserPrompt({ input: prompt }),
        TIMEOUT_MS,
        'Gemini'
      );
      
      if (response.output && response.output.keyResults) {
        console.log(`[parseOperationalPlan] Gemini success: ${response.output.keyResults.length} KRs`);
        const sanitizedResults = response.output.keyResults.map((kr: any, i: number) => sanitizeKeyResult(kr, i));
        return { keyResults: sanitizedResults };
      }
      lastError = 'Gemini returned empty output';
    } catch (error: any) {
      lastError = error.message;
      console.error('[parseOperationalPlan] Gemini failed:', lastError);
    }
  }

  // All providers failed
  throw new Error(`AI parsing failed: ${lastError || 'No AI provider configured'}`);
}
