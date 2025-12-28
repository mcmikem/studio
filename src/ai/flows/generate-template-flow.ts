
'use server';

/**
 * @fileOverview An AI flow to generate a structured task template from a description.
 */

import { ai } from '@/ai/genkit';
import type { GenerateTemplateInput, GenerateTemplateOutput } from '@/lib/types';
import { GenerateTemplateInputSchema, GenerateTemplateOutputSchema } from '@/lib/types';
import { googleAI } from '@genkit-ai/google-genai';


const templateGeneratorPrompt = ai.definePrompt({
    name: 'templateGeneratorPrompt',
    input: { schema: GenerateTemplateInputSchema },
    output: { schema: GenerateTemplateOutputSchema },
    prompt: `You are an expert at creating Standard Operating Procedures (SOPs) and checklists for an NGO.
  Your task is to take a user's description of a process and turn it into a structured JSON object that conforms to the provided schema.

  **Instructions:**
  1.  **Create a Title:** Generate a short, clear title for the template based on the description.
  2.  **Generate Checklist Items:** Break down the described process into a series of distinct, actionable steps. Each step should be a checklist item.
  3.  **Be Action-Oriented:** Start each checklist item with a verb (e.g., "Confirm," "Draft," "Upload," "Schedule").
  4.  **Be Comprehensive:** Think through the process and include all necessary steps, even if not explicitly mentioned by the user.
  
  Now, generate the JSON object for the following process:

  "{{description}}"
  `,
});


export const generateTemplate = ai.defineFlow(
    {
        name: 'generateTemplateFlow',
        inputSchema: GenerateTemplateInputSchema,
        outputSchema: GenerateTemplateOutputSchema
    },
    async (input) => {
        const {output} = await templateGeneratorPrompt(input);

        if (!output) {
            throw new Error('AI failed to generate the template.');
        }
        return output;
    }
)
