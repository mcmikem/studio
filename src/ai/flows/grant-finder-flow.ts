
'use server';

/**
 * @fileOverview An AI flow to find and suggest grant opportunities.
 */
import { ai } from '@/ai/genkit';
import type { GrantFinderInput, GrantFinderOutput } from '@/lib/types';
import { findGrantOpportunitiesToolObject, grantFinderPrompt } from '@/ai/definitions';

export async function findGrants(input: GrantFinderInput): Promise<GrantFinderOutput> {
    const {output} = await grantFinderPrompt(input);

    if (!output) {
      throw new Error('AI failed to generate a response for grant opportunities.');
    }
    
    return output;
}
