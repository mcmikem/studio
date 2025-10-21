
'use server';

/**
 * @fileOverview This file is deprecated. The `searchOmuto` tool now provides
 * the global search functionality and is called by the `omuto-ai-flow`.
 */

import { SearchInput, SearchOutput } from '@/lib/types';

// This flow is no longer used. The logic is now inside the `searchOmuto` tool.
export async function searchOmuto(input: SearchInput): Promise<SearchOutput> {
    console.warn("DEPRECATED: searchOmuto flow is called. This logic has moved to the searchOmuto tool.");
    return { results: [] };
}
