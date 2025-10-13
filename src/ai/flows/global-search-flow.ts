
'use server';

/**
 * @fileOverview A Genkit flow for global, natural language search across the app.
 */

import { ai } from '@/ai/genkit';
import { findUsersByName, findProgramsByName, findExpensesByTitle } from '../tools/omuto-tools';
import { SearchInput, SearchOutput, SearchInputSchema, SearchOutputSchema } from '@/lib/types';


const searchPrompt = ai.definePrompt(
  {
    name: 'globalSearchPrompt',
    system: "You are a search agent. Your job is to use the available tools to find information based on the user's query and return it in a structured format. You can only use the tools provided. You can use multiple tools if the query is broad.",
    tools: [findUsersByName, findProgramsByName, findExpensesByTitle],
    output: {
      schema: SearchOutputSchema,
    },
  }
);


export async function searchOmuto(input: SearchInput): Promise<SearchOutput> {
    const llmResponse = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        tools: [searchPrompt],
        prompt: `Find information related to: "${input.query}"`,
        config: {
            temperature: 0.1, // Be very factual
        },
    });

    const { output } = llmResponse;
    if (!output) {
      throw new Error('AI failed to generate a search response.');
    }
    
    // Ensure uniqueness of results, sometimes the LLM might call tools that return overlapping data
    const uniqueResults = Array.from(new Map(output.results.map(item => [item.id, item])).values());
    
    return { results: uniqueResults };
}
