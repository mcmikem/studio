'use server';
import { searchOmutoToolObject } from '@/ai/definitions';
import { SearchResultItemSchema } from '@/lib/types';
import { z } from 'zod';

export async function searchOmutoTool(): Promise<(input: { query: string; }) => Promise<z.infer<typeof SearchResultItemSchema>[]>> {
  // Since the tool object itself is what's used, we can return it.
  // The client will then execute it.
  return searchOmutoToolObject.fn;
}
