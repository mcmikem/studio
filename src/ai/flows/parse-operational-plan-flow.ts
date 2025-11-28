
'use server';

/**
 * @fileOverview An AI flow to parse an unstructured operational plan into structured Key Result data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { ParsePlanInput, ParsePlanOutput } from '@/lib/types';
import { ParsePlanInputSchema, ParsePlanOutputSchema } from '@/lib/types';


const planParserPrompt = ai.definePrompt({
  name: 'operationalPlanParserPrompt',
  input: { schema: ParsePlanInputSchema },
  output: { schema: ParsePlanOutputSchema },
  prompt: `You are an expert M&E (Monitoring and Evaluation) assistant. Your task is to read a raw text operational plan for an NGO and extract all the Key Results (KRs) into a structured JSON format that conforms to the provided schema.

  **Instructions:**
  1.  **Identify Key Results:** Scan the text for items explicitly labeled with a KR code (e.g., "OCT-KR1", "NOV-KR1", "Q4-KR3").
  2.  **Extract Details:** For each KR found, extract the following information:
      - **title:** The KR code itself (e.g., "OCT-KR1").
      - **description:** The short summary of the objective.
      - **target:** The numerical goal. Extract only the number (e.g., for "2M UGX", the target is 2000000; for "510 trees", it's 510).
      - **deadline:** The specified end date. Convert it to YYYY-MM-DD format.
      - **priority:** Assign 'High', 'Medium', 'Low' based on context clues. If none, default to 'Medium'.
  3.  **Set Initial Progress:** The 'currentProgress' for all extracted KRs must always be set to 0, as this is a new plan.
  
  Please parse the following operational plan text into a structured JSON object.

  **Operational Plan Text:**
  ---
  {{planText}}
  ---
  `,
});

export async function parseOperationalPlan(input: ParsePlanInput): Promise<ParsePlanOutput> {
  const llmResponse = await planParserPrompt(input);
  const output = llmResponse.output();

  if (!output) {
    throw new Error('AI failed to parse the operational plan.');
  }

  // Ensure currentProgress is always 0 for new plans
  const sanitizedResults = output.keyResults.map(kr => ({ ...kr, currentProgress: 0 }));
  return { keyResults: sanitizedResults };
}
