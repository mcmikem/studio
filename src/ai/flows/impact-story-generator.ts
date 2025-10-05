'use server';

/**
 * @fileOverview A GenAI-powered tool to automatically generate compelling narratives from activity data.
 *
 * - generateImpactStory - A function that generates impact stories.
 * - ImpactStoryInput - The input type for the generateImpactStory function.
 * - ImpactStoryOutput - The return type for the generateImpactStory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImpactStoryInputSchema = z.object({
  activityName: z.string().describe('The name of the activity.'),
  activityDescription: z.string().describe('A detailed description of the activity.'),
  activityImpact: z.string().describe('The measurable impact of the activity (e.g., number of trees planted, people reached).'),
  photoDataUri: z
    .string()
    .describe(
      "A photo related to the activity, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  userName: z.string().describe('The name of a user involved in the activity, to add a personal touch.'),
  userQuote: z.string().describe('A quote from a user about the activity.'),
});
export type ImpactStoryInput = z.infer<typeof ImpactStoryInputSchema>;

const ImpactStoryOutputSchema = z.object({
  impactStory: z.string().describe('A compelling narrative generated from the activity data.'),
});
export type ImpactStoryOutput = z.infer<typeof ImpactStoryOutputSchema>;

export async function generateImpactStory(input: ImpactStoryInput): Promise<ImpactStoryOutput> {
  return impactStoryGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'impactStoryPrompt',
  input: {schema: ImpactStoryInputSchema},
  output: {schema: ImpactStoryOutputSchema},
  prompt: `You are a skilled storyteller for Omuto Foundation, crafting engaging narratives that highlight the impact of our activities.

  Based on the following activity data, generate a compelling story suitable for social media and Omuto Pulse. Include a quote from a user involved in the activity, and make it inspiring and shareable. Focus on the human impact and the positive change created.

  Activity Name: {{{activityName}}}
  Activity Description: {{{activityDescription}}}
  Activity Impact: {{{activityImpact}}}
  User Name: {{{userName}}}
  User Quote: {{{userQuote}}}
  Photo: {{media url=photoDataUri}}

  Generated Impact Story:`, // Ensure this outputs a complete, well-formed narrative
});

const impactStoryGeneratorFlow = ai.defineFlow(
  {
    name: 'impactStoryGeneratorFlow',
    inputSchema: ImpactStoryInputSchema,
    outputSchema: ImpactStoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
