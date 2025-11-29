
'use server';

/**
 * @fileOverview An AI flow to find and suggest grant opportunities.
 */
import { ai } from '@/ai/genkit';
import type { GrantFinderInput, GrantFinderOutput } from '@/lib/types';
import { findGrantOpportunitiesTool, grantFinderPrompt } from '@/ai/definitions';

export async function findGrants(input: GrantFinderInput): Promise<GrantFinderOutput> {
    const llmResponse = await grantFinderPrompt(input);
    const output = llmResponse.output();

    if (!output) {
      throw new Error('AI failed to generate a response for grant opportunities.');
    }
    
    return output;
}
