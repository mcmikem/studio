
'use server';

/**
 * @fileOverview A GenAI-powered tool to automatically generate compelling narratives from activity data.
 *
 * - generateImpactStory - A function that generates impact stories.
 */

import {ai} from '@/ai/genkit';
import { ImpactStoryInputSchema, ImpactStoryOutputSchema, type ImpactStoryInput, type ImpactStoryOutput } from '@/lib/types';


const prompt = ai.definePrompt({
  name: 'impactStoryPrompt',
  input: {schema: ImpactStoryInputSchema},
  output: {schema: ImpactStoryOutputSchema},
  model: 'gemini-pro',
  prompt: `You are a skilled storyteller for Omuto Foundation, crafting engaging narratives that highlight the impact of our activities. Your output must be a JSON object with a single key "impactStory".
  
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
  {{/if}}`,
});

const impactStoryGeneratorFlow = ai.defineFlow(
  {
    name: 'impactStoryGeneratorFlow',
    inputSchema: ImpactStoryInputSchema,
    outputSchema: ImpactStoryOutputSchema,
  },
  async input => {
    const llmResponse = await prompt(input);
    const output = llmResponse.output();

    if (!output) {
      throw new Error('Could not generate story');
    }
    
    return output;
  }
);


export async function generateImpactStory(input: ImpactStoryInput): Promise<ImpactStoryOutput> {
  return impactStoryGeneratorFlow(input);
}
