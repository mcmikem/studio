
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
  userName: z.string().describe('The name of a user involved in the activity, to add a personal touch.'),
  userQuote: z.string().optional().describe('A quote from a user or beneficiary about the activity.'),
  memorableMoment: z.string().optional().describe('A specific, powerful interaction or observation from the activity.'),
  challengesLearned: z.string().optional().describe('Surprising challenges and how they were overcome.'),
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

  Based on the following activity data, generate a compelling story suitable for social media and Omuto Pulse. Weave in the narrative details provided to make the story authentic and inspiring. Focus on the human impact and the positive change created.

  Activity Name: {{{activityName}}}
  Activity Description: {{{activityDescription}}}
  Measurable Impact: {{{activityImpact}}}
  Team Member: {{{userName}}}
  
  {{#if memorableMoment}}
  Memorable Moment: "{{{memorableMoment}}}"
  {{/if}}

  {{#if challengesLearned}}
  Key Learning: "{{{challengesLearned}}}"
  {{/if}}

  {{#if userQuote}}
  Quote from a Beneficiary: "{{{userQuote}}}"
  {{/if}}

  Generated Impact Story:`,
});

export const impactStoryGeneratorFlow = ai.defineFlow(
  {
    name: 'impactStoryGeneratorFlow',
    inputSchema: ImpactStoryInputSchema,
    outputSchema: ImpactStoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Could not generate story');
    }
    return output;
  }
);
