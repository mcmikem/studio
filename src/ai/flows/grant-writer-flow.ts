
'use server';

/**
 * @fileOverview An AI flow to draft a concept note for a grant proposal.
 */

import { ai } from '@/ai/genkit';
import { KNOWLEDGE_BASE } from '@/lib/data';
import type { GrantWriterInput, GrantWriterOutput } from '@/lib/types';
import { GrantWriterInputSchema, GrantWriterOutputSchema } from '@/lib/types';


const grantWriterPrompt = ai.definePrompt({
  name: 'grantWriterPrompt',
  input: { schema: GrantWriterInputSchema },
  prompt: `
  Your entire output MUST be a single, valid JSON object that conforms to the following Zod schema:
  \`\`\`
  z.object({
    conceptNote: z.string().describe("A concise and persuasive concept note for the proposal, written in markdown format. It should include sections for Introduction, Problem Statement, Proposed Solution (linking to Omuto's ecosystem model), and Budget Overview."),
  })
  \`\`\`

  Use the following knowledge base:
  ---
  ${KNOWLEDGE_BASE}
  ---
  
  **IMPORTANT:**
  - The tone should be professional, confident, and passionate.
  - The output MUST be in markdown format.
  - Connect the proposed activities directly to Omuto's proven Ecosystem Model (Identify & Inspire, Equip & Empower, Activate & Sustain).
  - Structure the note with the following sections: **Introduction**, **Problem Statement**, **Our Proven Solution**, **Budget Overview**.
  - Keep it concise and impactful.

  Now, draft a concept note for a proposal titled "**{{proposalTitle}}**" to be sent to **{{partnerName}}**.

  The amount we are requesting is **{{amountRequested}} UGX**.

  Generate the JSON object now.
`,
});

export async function writeConceptNote(input: GrantWriterInput): Promise<GrantWriterOutput> {
  const llmResponse = await grantWriterPrompt(input);
  const text = llmResponse.text;

  if (!text) {
    throw new Error('AI failed to generate a concept note.');
  }
  
  try {
    const jsonText = text.trim().replace(/^```json|```$/g, '').trim();
    const parsed = JSON.parse(jsonText);
    return GrantWriterOutputSchema.parse(parsed);
  } catch (e) {
    console.error("Failed to parse AI response as JSON:", e);
    throw new Error('AI returned an invalid concept note format.');
  }
}
