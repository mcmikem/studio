
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

function parseMetricValue(input: string | number): { target: number; unit: string } {
  if (typeof input === 'number') {
    return { target: input, unit: '' };
  }
  
  const str = String(input).trim();
  const match = str.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  
  if (match) {
    return {
      target: parseFloat(match[1]) || 0,
      unit: match[2]?.trim() || ''
    };
  }
  
  const numMatch = str.match(/\d+/);
  return {
    target: numMatch ? parseFloat(numMatch[0]) : 0,
    unit: str.replace(/\d+/, '').trim()
  };
}

function sanitizeKeyResult(kr: any, index: number): any {
  const { target, unit } = parseMetricValue(kr.target);
  
  return {
    title: String(kr.title || `KR${index + 1}`).substring(0, 200),
    description: String(kr.description || '').substring(0, 500),
    target: target,
    unit: unit || kr.unit || '',
    deadline: String(kr.deadline || '').substring(0, 10),
    priority: ['High', 'Medium', 'Low'].includes(kr.priority) ? kr.priority : 'Medium',
    currentProgress: 0,
    current: kr.current || 0,
  };
}

export async function parseOperationalPlan(input: ParsePlanInput): Promise<ParsePlanOutput> {
  const validation = ParsePlanInputSchema.safeParse(input);
  if (!validation.success) {
    throw new Error('Invalid input: ' + validation.error.message);
  }

  const prompt = `Extract Key Results from this operational plan. Return ONLY valid JSON.

For each Key Result, extract:
- title: The name of the result
- description: What this measures
- target: The TARGET NUMBER only (extract just the number, e.g., "50 students" → 50, "1.5M UGX" → 1500000)
- unit: The unit type if mentioned (e.g., "students", "trees", "youth", "sessions")
- deadline: YYYY-MM-DD format
- priority: "High", "Medium", or "Low"

Format:
{"keyResults": [{"title": "Reach 50 youth", "description": "Train youth in vocational skills", "target": 50, "unit": "youth", "deadline": "2024-12-31", "priority": "High"}]}

Text to parse:
${input.planText}`;

  let lastError = '';

  if (aiConfig.provider === 'openrouter' && aiConfig.openRouterApiKey) {
    try {
      console.log('[parseOperationalPlan] Attempting OpenRouter...');
      const systemPrompt = `You are an expert M&E assistant. Return ONLY valid JSON. No markdown, no explanations. Always extract numbers from metric descriptions (e.g., "50 youth" → target: 50, unit: "youth").`;
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

  throw new Error(`AI parsing failed: ${lastError || 'No AI provider configured'}`);
}
