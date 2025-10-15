
'use server';

/**
 * @fileOverview An AI flow to parse unstructured text into a structured weekly workplan.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ParseWorkplanInputSchema = z.object({
  textPlan: z.string().describe('The unstructured, raw text of a weekly plan.'),
});
export type ParseWorkplanInput = z.infer<typeof ParseWorkplanInputSchema>;

const PriorityItemSchema = z.object({
    activity: z.string().describe('The specific task or activity to be done.'),
    priority: z.enum(['High', 'Medium', 'Low']).describe('The priority level of the activity.'),
    responsible: z.array(z.string()).describe('A list of names or roles responsible for the activity.'),
    deadline: z.string().optional().describe('The deadline for the activity, if mentioned (YYYY-MM-DD format).'),
});

const ParseWorkplanOutputSchema = z.object({
  keyPriorities: z.array(PriorityItemSchema).describe('A list of structured priority items extracted from the text.'),
  message: z.string().describe('A one or two-sentence summary of the overall focus or goal for the week.'),
});
export type ParseWorkplanOutput = z.infer<typeof ParseWorkplanOutputSchema>;

const workplanParserPrompt = ai.definePrompt({
  name: 'workplanParserPrompt',
  input: { schema: ParseWorkplanInputSchema },
  output: { schema: ParseWorkplanOutputSchema },
  system: `You are an expert administrative assistant. Your task is to read an unstructured block of text representing a team's weekly plan and convert it into a structured JSON format.

  **Instructions:**
  1.  **Extract Key Priorities:** Identify each distinct task or activity.
  2.  **Assign Priority:** Based on keywords (e.g., "must do", "urgent", "critical" -> High; "should do", "important" -> Medium; "if time", "nice to have" -> Low), assign a priority. If no keyword is present, default to 'Medium'.
  3.  **Identify Responsible Parties:** Look for names (e.g., "Dianah", "McMike", "Alex") or roles ("All Members", "Volunteers") associated with each task.
  4.  **Extract Deadlines:** If a specific date is mentioned, format it as YYYY-MM-DD.
  5.  **Summarize:** Create a concise one or two-sentence summary of the main goal for the week to use as the 'message'.`,
  prompt: `Please parse the following weekly plan text into a structured format.

  **User's Text:**
  ---
  {{textPlan}}
  ---
  `,
});

export async function parseWorkplan(input: ParseWorkplanInput): Promise<ParseWorkplanOutput> {
  const { output } = await workplanParserPrompt(input);
  if (!output) {
    throw new Error('AI failed to parse the workplan.');
  }
  return output;
}

    