
'use server';

/**
 * @fileOverview An AI flow to parse an unstructured operational plan into structured Key Result data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const KeyResultSchema = z.object({
  title: z.string().describe("The unique identifier for the Key Result, e.g., 'OCT-KR1' or 'NOV-KR3'."),
  description: z.string().describe("A concise summary of what the Key Result aims to achieve."),
  currentProgress: z.number().default(0).describe("The starting progress for this new plan, which is always 0."),
  target: z.number().describe("The numerical target for the Key Result."),
  deadline: z.string().describe("The deadline for the Key Result, formatted as YYYY-MM-DD."),
  priority: z.enum(['High', 'Medium', 'Low']).describe("The priority level of the Key Result."),
});

const ParsePlanInputSchema = z.object({
  planText: z.string().describe('The full, unstructured text of the monthly or quarterly operational plan.'),
});

const ParsePlanOutputSchema = z.object({
  keyResults: z.array(KeyResultSchema).describe('A list of all Key Results extracted from the plan text.'),
});

export type ParsePlanInput = z.infer<typeof ParsePlanInputSchema>;
export type ParsePlanOutput = z.infer<typeof ParsePlanOutputSchema>;

const planParserPrompt = ai.definePrompt({
  name: 'operationalPlanParserPrompt',
  input: { schema: ParsePlanInputSchema },
  output: { schema: ParsePlanOutputSchema },
  system: `You are an expert M&E (Monitoring and Evaluation) assistant. Your task is to read a raw text operational plan for an NGO and extract all the Key Results (KRs) into a structured JSON format.

  **Instructions:**
  1.  **Identify Key Results:** Scan the text for items explicitly labeled with a KR code (e.g., "OCT-KR1", "NOV-KR1", "Q4-KR3").
  2.  **Extract Details:** For each KR found, extract the following information:
      - **title:** The KR code itself (e.g., "OCT-KR1").
      - **description:** The short summary of the objective.
      - **target:** The numerical goal. Extract only the number (e.g., for "2M UGX", the target is 2000000; for "510 trees", it's 510).
      - **deadline:** The specified end date. Convert it to YYYY-MM-DD format.
      - **priority:** Assign 'High', 'Medium', or 'Low' based on context clues. If none, default to 'Medium'.
  3.  **Set Initial Progress:** The 'currentProgress' for all extracted KRs must always be set to 0, as this is a new plan.
  4.  **Format Output:** Return a JSON object containing a single key "keyResults" which is an array of the structured KR objects.
  `,
  prompt: `Please parse the following operational plan text into a structured list of Key Results.

  **Operational Plan Text:**
  ---
  {{planText}}
  ---
  `,
});

export async function parseOperationalPlan(input: ParsePlanInput): Promise<ParsePlanOutput> {
  const { output } = await planParserPrompt(input);
  if (!output) {
    throw new Error('AI failed to parse the operational plan.');
  }
  // Ensure currentProgress is always 0 for new plans
  const sanitizedResults = output.keyResults.map(kr => ({ ...kr, currentProgress: 0 }));
  return { keyResults: sanitizedResults };
}

