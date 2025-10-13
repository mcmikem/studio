
'use server';

/**
 * @fileOverview An AI flow to find and suggest grant opportunities.
 */

import { ai } from '@/ai/genkit';
import { findGrantOpportunities } from '../tools/omuto-tools';
import { z } from 'zod';

const GrantFinderInputSchema = z.object({
  query: z.string().describe('The user\'s search query for grant opportunities (e.g., "youth empowerment uganda").'),
});
export type GrantFinderInput = z.infer<typeof GrantFinderInputSchema>;


const GrantOpportunitySchema = z.object({
  title: z.string(),
  funder: z.string(),
  description: z.string(),
  amount: z.number(),
  deadline: z.string().describe("Formatted as YYYY-MM-DD"),
});

const GrantFinderOutputSchema = z.object({
  opportunities: z.array(GrantOpportunitySchema).describe('A list of potential grant opportunities found.'),
});
export type GrantFinderOutput = z.infer<typeof GrantFinderOutputSchema>;


const grantFinderPrompt = ai.definePrompt(
  {
    name: 'grantFinderPrompt',
    system: "You are an expert at summarizing grant opportunities. The user will provide a query, and you will receive a list of potential grants from a search tool. Your job is to analyze the tool's output and present the most relevant opportunities in a clear, structured format. Do not add any grants that are not from the tool output.",
    tools: [findGrantOpportunities],
    output: {
      schema: GrantFinderOutputSchema,
    },
  }
);


export async function findGrants(input: GrantFinderInput): Promise<GrantFinderOutput> {
    const llmResponse = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        tools: [grantFinderPrompt],
        prompt: `Please find grant opportunities related to the following query: "${input.query}"`,
        config: {
            temperature: 0.2, // Be more factual and less creative
        },
    });

    const { output } = llmResponse;
    if (!output) {
      throw new Error('AI failed to generate a response for grant opportunities.');
    }
    return output;
}
