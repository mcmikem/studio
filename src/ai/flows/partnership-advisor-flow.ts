
'use server';

/**
 * @fileOverview An AI flow to analyze the partnership pipeline and provide strategic advice.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getPartnerships } from '../tools/omuto-tools';
import { KNOWLEDGE_BASE } from '@/lib/data';

const PartnershipAdvisorInputSchema = z.object({});
export type PartnershipAdvisorInput = z.infer<typeof PartnershipAdvisorInputSchema>;

const PartnershipAdvisorOutputSchema = z.object({
  recommendations: z.array(z.object({
    partnerName: z.string(),
    recommendation: z.string().describe("A concise, actionable recommendation."),
    reason: z.string().describe("The reason for the recommendation."),
    priority: z.enum(['High', 'Medium', 'Low']),
  })).describe('A list of strategic recommendations for managing partnerships.'),
});
export type PartnershipAdvisorOutput = z.infer<typeof PartnershipAdvisorOutputSchema>;

const advisorPrompt = ai.definePrompt({
  name: 'partnershipAdvisorPrompt',
  system: `${KNOWLEDGE_BASE}
  
  You are an expert Partnerships Manager and Strategic Advisor for Omuto Foundation.
  Your task is to analyze the entire partnership pipeline and provide a short list of the top 3 most critical, actionable recommendations for the team right now.
  
  Focus on:
  - **Risk Mitigation:** Identify partners whose relationships might be going stale (e.g., 'Strong' health but no recent contact) or who are 'At Risk'.
  - **Opportunity Seizing:** Find partners in 'Prospecting' or 'Negotiation' with high potential that need a nudge to move forward.
  - **Alignment:** Ensure 'Active' partners are still aligned with our current Key Results (like OCT-KR4).
  
  Provide concise, direct, and actionable advice.`,
  tools: [getPartnerships],
  output: {
    schema: PartnershipAdvisorOutputSchema,
  },
});

export async function partnershipAdvisor(input: PartnershipAdvisorInput): Promise<PartnershipAdvisorOutput> {
  const llmResponse = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt: `Analyze our current partnership pipeline and provide your top 3 strategic recommendations. Today's date is ${new Date().toDateString()}.`,
    tools: [advisorPrompt],
  });

  const output = llmResponse.output;
  if (!output) {
    throw new Error("The AI failed to generate partnership advice.");
  }
  return output;
}
