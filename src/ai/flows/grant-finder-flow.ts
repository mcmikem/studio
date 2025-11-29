
'use server';

/**
 * @fileOverview An AI flow to find and suggest grant opportunities.
 */
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import type { GrantFinderInput, GrantFinderOutput } from '@/lib/types';
import { z } from 'zod';
import { GrantFinderOutputSchema } from '@/lib/types';

export async function findGrants(input: GrantFinderInput): Promise<GrantFinderOutput> {
    console.log('Starting findGrants flow');
    
    const ai = genkit({
        plugins: [googleAI()],
    });
    console.log('AI instance created for findGrants');

    const findGrantOpportunitiesToolObject = ai.defineTool(
        {
            name: 'findGrantOpportunities',
            description: 'Searches for grant and funding opportunities based on a query. This is a simulation and will return mock data.',
            inputSchema: z.object({
            query: z.string().describe('The search query, e.g., "youth empowerment uganda"'),
            }),
            outputSchema: z.array(
            z.object({
                title: z.string(),
                funder: z.string(),
                description: z.string(),
                amount: z.number(),
                deadline: z.string().describe("YYYY-MM-DD format"),
            })
            ),
        },
        async ({ query }) => {
            // This is a MOCK implementation. In a real app, this would call a real search API.
            console.log(`Simulating search for grant opportunities with query: "${query}"`);
            const MOCK_OPPORTUNITIES = [
            {
                title: 'Youth Empowerment & Skilling Grant 2025',
                funder: 'Global Youth Fund',
                description: 'Supports projects focused on vocational training and entrepreneurship for young people in East Africa.',
                amount: 50000000,
                deadline: '2025-12-15',
            },
            {
                title: 'Community Climate Action Fund',
                funder: 'Green Future Foundation',
                description: 'Provides funding for grassroots environmental projects, including tree planting and conservation education.',
                amount: 25000000,
                deadline: '2025-11-30',
            },
            {
                title: 'Digital Literacy for Rural Girls',
                funder: 'TechForShe',
                description: 'A grant for organizations providing digital skills and access to technology for girls in rural areas.',
                amount: 75000000,
                deadline: '2026-01-20',
            },
            {
                title: 'Menstrual Health Equity Grant',
                funder: 'Dignity for All Foundation',
                description: 'Funding for projects addressing menstrual health education and access to sanitary products.',
                amount: 30000000,
                deadline: '2025-12-01',
            },
            ];
            // Simple filter to make the mock data slightly responsive to the query
            return MOCK_OPPORTUNITIES.filter(op => op.description.toLowerCase().includes(query.split(' ')[0].toLowerCase()));
        }
    );

    const grantFinderPrompt = ai.definePrompt(
        {
          name: 'grantFinderPrompt',
          tools: [findGrantOpportunitiesToolObject],
          output: { schema: GrantFinderOutputSchema },
          model: 'googleai/gemini-1.5-flash',
          prompt: `You are an expert at summarizing grant opportunities. The user will provide a query, and you will receive a list of potential grants from a search tool. Your job is to analyze the tool's output and present the most relevant opportunities in a clear, structured JSON format that conforms to the provided schema. Do not add any grants that are not from the tool output.
          
          Please find grant opportunities related to the following query: "{{query}}"`,
        }
    );

    const llmResponse = await grantFinderPrompt(input);
    const output = llmResponse.output();

    if (!output) {
      throw new Error('AI failed to generate a response for grant opportunities.');
    }
    
    console.log('findGrants flow completed successfully.');
    return output;
}
