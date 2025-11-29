
'use server';

/**
 * @fileOverview The AI-powered daily planner flow.
 * This flow takes a user's primary mission, their role, and organizational context
 * to generate a structured, strategic daily plan.
 */

import { ai } from '@/ai/genkit';
import type { DailyPlannerAIInput, DailyPlannerAIOutput } from '@/lib/types';
import { dailyPlannerPrompt } from '@/ai/definitions';


export async function dailyPlannerAI(input: DailyPlannerAIInput): Promise<DailyPlannerAIOutput> {

  // Sanitize the key results to ensure dates are strings and no complex objects are passed
  const sanitizedKeyResults = (input.keyResults || []).map((kr: any) => ({
    ...kr,
    deadline: kr.deadline ? new Date(kr.deadline).toISOString().split('T')[0] : 'N/A',
    createdAt: undefined, // Remove complex objects
  }));

  const sanitizedInput = {
      ...input,
      keyResults: sanitizedKeyResults,
  };

  const llmResponse = await dailyPlannerPrompt(sanitizedInput);
  const output = llmResponse.output();
  
  if (!output) {
    throw new Error('AI failed to generate a plan.');
  }
  
  return output;
}
