
'use server';

/**
 * @fileOverview A Genkit flow for global, natural language search across the app.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { findUsersByName, findProgramsByName, findExpensesByTitle } from '../tools/omuto-tools';

const SearchInputSchema = z.object({
  query: z.string().describe('The user\'s natural language search query.'),
});
export type SearchInput = z.infer<typeof SearchInputSchema>;

const SearchResultItemSchema = z.object({
    id: z.string(),
    type: z.string().describe("The type of the entity (e.g., 'User', 'Program', 'Expense')."),
    title: z.string().describe("The main title or name of the item."),
    url: z.string().describe("The in-app URL to navigate to the item."),
});

const SearchOutputSchema = z.object({
  results: z.array(SearchResultItemSchema).describe('A list of search results.'),
});
export type SearchOutput = z.infer<typeof SearchOutputSchema>;


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
