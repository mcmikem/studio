
'use server';

/**
 * @fileOverview A flow to perform a global search across the Omuto database.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { searchOmuto } from '../tools/omuto-tools';
import { SearchInputSchema, SearchOutputSchema, type SearchInput, type SearchOutput } from '@/lib/types';


const searchPrompt = ai.definePrompt(
  {
    name: 'globalSearchPrompt',
    system: "You are a search orchestrator. The user will provide a query. Your only job is to call the `searchOmuto` tool with the user's exact query.",
    tools: [searchOmuto],
  }
);


export async function globalSearch(input: SearchInput): Promise<SearchOutput> {
    const { output } = await searchPrompt({
        prompt: `Search for: "${input.query}"`,
    });
    if (!output) {
      throw new Error('AI failed to generate a response for the global search.');
    }
    return { results: output };
}
