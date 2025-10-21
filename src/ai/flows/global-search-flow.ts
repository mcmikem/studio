
'use server';

/**
 * @fileOverview This file is now deprecated. The global search functionality
 * has been integrated directly into the `searchOmuto` tool in `omuto-tools.ts`
 * and is called by the main `omuto-ai-flow.ts`.
 */

import { SearchInput, SearchOutput, SearchInputSchema, SearchOutputSchema } from '@/lib/types';

// This flow is no longer used. The logic is now inside the `searchOmuto` tool.
export async function searchOmuto(input: SearchInput): Promise<SearchOutput> {
    console.warn("DEPRECATED: searchOmuto flow is called. This logic has moved to the searchOmuto tool.");
    return { results: [] };
}

    