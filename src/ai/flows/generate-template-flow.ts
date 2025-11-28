
'use server';

/**
 * @fileOverview An AI flow to generate a structured task template from a description.
 */

import { ai } from '@/ai/genkit';
import type { GenerateTemplateInput, GenerateTemplateOutput } from '@/lib/types';
import { GenerateTemplateInputSchema, GenerateTemplateOutputSchema } from '@/lib/types';

const templateGeneratorPrompt = ai.definePrompt({
  name: 'templateGeneratorPrompt',
  input: { schema: GenerateTemplateInputSchema },
  prompt: `You are an expert at creating Standard Operating Procedures (SOPs) and checklists for an NGO.
  Your task is to take a user's description of a process and turn it into a structured JSON object.
  Your entire output MUST be a single, valid JSON object that conforms to the following Zod schema:

  \`\`\`
  z.object({
    title: z.string().describe('A clear and concise title for the generated template.'),
    checklistItems: z.array(z.string()).describe('A list of specific, actionable checklist items.'),
  })
  \`\`\`
  
  Instructions:
  1.  **Create a Title:** Generate a short, clear title for the template based on the description.
  2.  **Generate Checklist Items:** Break down the described process into a series of distinct, actionable steps. Each step should be a checklist item.
  3.  **Be Action-Oriented:** Start each checklist item with a verb (e.g., "Confirm," "Draft," "Upload," "Schedule").
  4.  **Be Comprehensive:** Think through the process and include all necessary steps, even if not explicitly mentioned by the user.

  Now, generate the JSON object for the following process:

  "{{description}}"
  `,
});

export async function generateTemplate(input: GenerateTemplateInput): Promise<GenerateTemplateOutput> {
  const llmResponse = await templateGeneratorPrompt(input);
  const text = llmResponse.text;
  if (!text) {
    throw new Error('AI failed to generate the template.');
  }

  try {
    const jsonText = text.trim().replace(/^```json|```$/g, '').trim();
    const parsed = JSON.parse(jsonText);
    return GenerateTemplateOutputSchema.parse(parsed);
  } catch (e) {
    console.error("Failed to parse AI response as JSON:", e);
    throw new Error('AI returned an invalid template format.');
  }
}
