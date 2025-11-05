
'use server';

/**
 * @fileOverview A flow to perform a global search across the Omuto database and knowledge base.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { searchOmuto } from '../tools/omuto-tools';
import { SearchInputSchema, SearchResultItemSchema, type SearchInput, type SearchOutput } from '@/lib/types';
import { KNOWLEDGE_BASE } from '@/lib/data';


const searchPrompt = ai.definePrompt(
  {
    name: 'globalSearchPrompt',
    system: `You are a search orchestrator for Omuto Foundation. The user will provide a query. Your job is to first call the \`searchOmuto\` tool to search the database. Then, analyze the user's query to see if it matches any sections in the provided knowledge base (like 'Risk Management' or 'Individual Accountability'). If you find a relevant section, add a search result item for it with a URL to the '/plan' page.`,
    tools: [searchOmuto],
    output: {
      schema: z.object({
        results: z.array(SearchResultItemSchema)
      })
    }
  }
);


export async function globalSearch(input: SearchInput): Promise<SearchOutput> {
    const llmResponse = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        prompt: `Knowledge Base: ${KNOWLEDGE_BASE} \n\n User Query: "${input.query}"`,
        tools: [searchOmuto],
    });
    
    const output = llmResponse.output();
    if (!output) {
      throw new Error('AI failed to generate a response for the global search.');
    }
    return output;
}
