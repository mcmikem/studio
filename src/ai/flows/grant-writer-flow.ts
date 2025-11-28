
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
  output: { schema: GrantWriterOutputSchema },
  system: `
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
`,
  prompt: `Now, draft a concept note for a proposal titled "**{{proposalTitle}}**" to be sent to **{{partnerName}}**. The amount we are requesting is **{{amountRequested}} UGX**.`,
});

export async function writeConceptNote(input: GrantWriterInput): Promise<GrantWriterOutput> {
  const llmResponse = await grantWriterPrompt(input);
  const output = llmResponse.output();

  if (!output) {
    throw new Error('AI failed to generate a concept note.');
  }
  
  return output;
}
