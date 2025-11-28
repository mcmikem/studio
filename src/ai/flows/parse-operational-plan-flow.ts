
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
  prompt: `You are an expert M&E (Monitoring and Evaluation) assistant. Your task is to read a raw text operational plan for an NGO and extract all the Key Results (KRs) into a structured JSON format.
  
  Your entire output MUST be a single, valid JSON object that conforms to the following Zod schema:
  \`\`\`
  z.object({
    keyResults: z.array(z.object({
      title: z.string().describe("The unique identifier for the Key Result, e.g., 'OCT-KR1' or 'NOV-KR3'."),
      description: z.string().describe("A concise summary of what the Key Result aims to achieve."),
      currentProgress: z.number().default(0).describe("The starting progress for this new plan, which is always 0."),
      target: z.number().describe("The numerical target for the Key Result."),
      deadline: z.string().describe("The deadline for the Key Result, formatted as YYYY-MM-DD."),
      priority: z.enum(['High', 'Medium', 'Low']).describe("The priority level of the Key Result."),
    })).describe('A list of all Key Results extracted from the plan text.'),
  })
  \`\`\`

  **Instructions:**
  1.  **Identify Key Results:** Scan the text for items explicitly labeled with a KR code (e.g., "OCT-KR1", "NOV-KR1", "Q4-KR3").
  2.  **Extract Details:** For each KR found, extract the following information:
      - **title:** The KR code itself (e.g., "OCT-KR1").
      - **description:** The short summary of the objective.
      - **target:** The numerical goal. Extract only the number (e.g., for "2M UGX", the target is 2000000; for "510 trees", it's 510).
      - **deadline:** The specified end date. Convert it to YYYY-MM-DD format.
      - **priority:** Assign 'High', 'Medium', or 'Low' based on context clues. If none, default to 'Medium'.
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
  const text = llmResponse.text;

  if (!text) {
    throw new Error('AI failed to parse the operational plan.');
  }

  try {
    const jsonText = text.trim().replace(/^```json|```$/g, '').trim();
    const parsed = JSON.parse(jsonText);
    const validated = ParsePlanOutputSchema.parse(parsed);
    // Ensure currentProgress is always 0 for new plans
    const sanitizedResults = validated.keyResults.map(kr => ({ ...kr, currentProgress: 0 }));
    return { keyResults: sanitizedResults };
  } catch(e) {
    console.error("Failed to parse AI response as JSON:", e);
    throw new Error('AI returned an invalid plan format.');
  }
}
