
'use server';

/**
 * @fileOverview An AI flow to find and suggest grant opportunities.
 */

import { ai } from '@/ai/genkit';
import { findGrantOpportunitiesTool } from '../tools/omuto-tools';
import type { GrantFinderInput, GrantFinderOutput } from '@/lib/types';
import { GrantFinderInputSchema, GrantFinderOutputSchema } from '@/lib/types';


export async function findGrants(input: GrantFinderInput): Promise<GrantFinderOutput> {
    
    const tool = await findGrantOpportunitiesTool();

    const grantFinderPrompt = ai.definePrompt(
      {
        name: 'grantFinderPrompt',
        tools: [tool],
        output: { schema: GrantFinderOutputSchema },
        model: 'googleai/gemini-pro',
        prompt: `You are an expert at summarizing grant opportunities. The user will provide a query, and you will receive a list of potential grants from a search tool. Your job is to analyze the tool's output and present the most relevant opportunities in a clear, structured JSON format that conforms to the provided schema. Do not add any grants that are not from the tool output.
        
        Please find grant opportunities related to the following query: "${input.query}"`,
      }
    );

    const {output} = await grantFinderPrompt({query: input.query});

    if (!output) {
      throw new Error('AI failed to generate a response for grant opportunities.');
    }
    
    return output;
}
