
'use server';

/**
 * @fileOverview An AI flow to find and suggest grant opportunities.
 */

import { ai } from '@/ai/genkit';
import { findGrantOpportunitiesTool } from '../tools/omuto-tools';
import { z } from 'zod';
import type { GrantFinderInput, GrantFinderOutput } from '@/lib/types';
import { GrantFinderOutputSchema } from '@/lib/types';


const grantFinderPrompt = ai.definePrompt(
  {
    name: 'grantFinderPrompt',
    system: "You are an expert at summarizing grant opportunities. The user will provide a query, and you will receive a list of potential grants from a search tool. Your job is to analyze the tool's output and present the most relevant opportunities in a clear, structured format. Do not add any grants that are not from the tool output.",
    tools: [findGrantOpportunitiesTool],
    output: {
      schema: GrantFinderOutputSchema
    },
  }
);


export async function findGrants(input: GrantFinderInput): Promise<GrantFinderOutput> {
    const { output } = await grantFinderPrompt({
        prompt: `Please find grant opportunities related to the following query: "${input.query}"`,
    });
    if (!output) {
      throw new Error('AI failed to generate a response for grant opportunities.');
    }
    return output;
}
