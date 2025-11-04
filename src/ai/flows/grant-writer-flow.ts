
'use server';

/**
 * @fileOverview An AI flow to draft a concept note for a grant proposal.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { KNOWLEDGE_BASE } from '@/lib/data';

const GrantWriterInputSchema = z.object({
  partnerName: z.string().describe("The name of the potential funder or partner."),
  amountRequested: z.number().describe("The amount of funding being requested in UGX."),
  proposalTitle: z.string().describe("The title of the proposal project."),
});
export type GrantWriterInput = z.infer<typeof GrantWriterInputSchema>;

const GrantWriterOutputSchema = z.object({
  conceptNote: z.string().describe("A concise and persuasive concept note for the proposal, written in markdown format. It should include sections for Introduction, Problem Statement, Proposed Solution (linking to Omuto's ecosystem model), and Budget Overview."),
});
export type GrantWriterOutput = z.infer<typeof GrantWriterOutputSchema>;


const grantWriterPrompt = ai.definePrompt({
  name: 'grantWriterPrompt',
  input: { schema: GrantWriterInputSchema },
  output: { schema: GrantWriterOutputSchema },
  system: `${KNOWLEDGE_BASE}
  
  **IMPORTANT:**
  - The tone should be professional, confident, and passionate.
  - The output MUST be in markdown format.
  - Connect the proposed activities directly to Omuto's proven Ecosystem Model (Identify & Inspire, Equip & Empower, Activate & Sustain).
  - Structure the note with the following sections: ### Introduction, ### Problem Statement, ### Our Proven Solution, ### Budget Overview.
  - Keep it concise and impactful.`,
  prompt: `
Draft a concept note for a proposal titled "**{{proposalTitle}}**" to be sent to **{{partnerName}}**.

The amount we are requesting is **{{amountRequested}} UGX**.

Please tailor the note to be compelling for a potential funder. Highlight our unique, integrated ecosystem model and focus on the tangible impact this funding will enable.
`,
});

export async function writeConceptNote(input: GrantWriterInput): Promise<GrantWriterOutput> {
  const { output } = await grantWriterPrompt(input);
  if (!output) {
    throw new Error('AI failed to generate a concept note.');
  }
  return output;
}
