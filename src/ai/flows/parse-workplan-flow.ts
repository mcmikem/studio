
'use server';

/**
 * @fileOverview An AI flow to parse unstructured text into a structured weekly workplan.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { ParseWorkplanInput, ParseWorkplanOutput } from '@/lib/types';
import { ParseWorkplanInputSchema, ParseWorkplanOutputSchema } from '@/lib/types';


const workplanParserPrompt = ai.definePrompt({
  name: 'workplanParserPrompt',
  input: { schema: ParseWorkplanInputSchema },
  prompt: `You are an expert administrative assistant. Your task is to read an unstructured block of text representing a team's weekly plan and convert it into a structured JSON format.
  
  Your entire output MUST be a single, valid JSON object that conforms to the following Zod schema:
  \`\`\`
  z.object({
    keyPriorities: z.array(z.object({
        activity: z.string().describe('The specific task or activity to be done.'),
        priority: z.enum(['High', 'Medium', 'Low']).describe('The priority level of the activity.'),
        responsible: z.array(z.string()).describe('A list of names or roles responsible for the activity.'),
        deadline: z.string().optional().describe('The deadline for the activity, if mentioned (YYYY-MM-DD format).'),
    })).describe('A list of structured priority items extracted from the text.'),
    message: z.string().describe('A one or two-sentence summary of the overall focus or goal for the week.'),
  })
  \`\`\`

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

export async function parseWorkplan(input: ParseWorkplanInput): Promise<ParseWorkplanOutput> {
  const llmResponse = await workplanParserPrompt(input);
  const text = llmResponse.text;

  if (!text) {
    throw new Error('AI failed to parse the workplan.');
  }

  try {
    const jsonText = text.trim().replace(/^```json|```$/g, '').trim();
    const parsed = JSON.parse(jsonText);
    return ParseWorkplanOutputSchema.parse(parsed);
  } catch (e) {
    console.error("Failed to parse AI response as JSON:", e);
    throw new Error('AI returned an invalid workplan format.');
  }
}
