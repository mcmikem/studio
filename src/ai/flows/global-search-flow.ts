
'use server';

/**
 * @fileOverview A flow to perform a global search across the Omuto database.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { searchOmuto } from '../tools/omuto-tools';
import { SearchInputSchema, SearchResultItemSchema, type SearchInput, type SearchOutput } from '@/lib/types';


const searchPrompt = ai.definePrompt(
  {
    name: 'globalSearchPrompt',
    system: "You are a search orchestrator. The user will provide a query. Your only job is to call the `searchOmuto` tool with the user's exact query.",
    tools: [searchOmuto],
    output: {
      schema: z.array(SearchResultItemSchema)
    }
  }
);


export async function globalSearch(input: SearchInput): Promise<SearchOutput> {
    const llmResponse = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        prompt: `Search for: "${input.query}"`,
        tools: [searchOmuto],
    });
    
    const output = llmResponse.output();
    if (!output) {
      throw new Error('AI failed to generate a response for the global search.');
    }
    return { results: output };
}
