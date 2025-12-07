
'use server';

/**
 * @fileOverview An AI flow to parse unstructured text into a structured weekly workplan.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { ParseWorkplanInput, ParseWorkplanOutput } from '@/lib/types';
import { ParseWorkplanInputSchema, ParseWorkplanOutputSchema } from '@/lib/types';
import { googleAI } from '@genkit-ai/google-genai';

export async function parseWorkplan(input: ParseWorkplanInput): Promise<ParseWorkplanOutput> {

  const workplanParserPrompt = ai.definePrompt({
    name: 'workplanParserPrompt',
    model: googleAI('gemini-1.5-flash-latest'),
    input: { schema: ParseWorkplanInputSchema },
    output: { schema: ParseWorkplanOutputSchema },
    prompt: `You are an expert administrative assistant. Your task is to read an unstructured block of text representing a team's weekly plan and convert it into a structured JSON format that conforms to the provided schema.

    **Instructions:**
    1.  **Extract Key Priorities:** Identify each distinct task or activity.
    2.  **Assign Priority:** Based on keywords (e.g., "must do", "urgent", "critical" -> High; "should do", "important" -> Medium; "if time", "nice to have" -> Low), assign a priority. If no keyword is present, default to 'Medium'.
    3.  **Identify Responsible Parties:** Look for names (e.g., "Dianah", "McMike", "Alex", "Kasirye", "Bwire", "John Paul") or roles ("All Members", "Volunteers", "Interns"). Always return an array of strings for the 'responsible' field, even if it's just one person. Be accurate with names.
    4.  **Extract Deadlines:** If a specific date is mentioned, format it as YYYY-MM-DD.
    5.  **Summarize:** Create a concise one or two-sentence summary of the main goal for the week to use as the 'message'.
    
    Please parse the following weekly plan text into a structured JSON object.

    **User's Text:**
    ---
    {{textPlan}}
    ---
    `,
  });

  const {output} = await workplanParserPrompt(input);

  if (!output) {
    throw new Error('AI failed to parse the workplan.');
  }

  return output;
}
