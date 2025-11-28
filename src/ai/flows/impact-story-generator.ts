
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
  prompt: `You are a skilled storyteller for Omuto Foundation, crafting engaging narratives that highlight the impact of our activities.
  
  Your entire output MUST be a single, valid JSON object that conforms to the following Zod schema:
  \`\`\`
  z.object({
    impactStory: z.string().describe('A compelling narrative generated from the activity data.'),
  })
  \`\`\`

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

  Now, generate the JSON object containing the impact story.`,
});

const impactStoryGeneratorFlow = ai.defineFlow(
  {
    name: 'impactStoryGeneratorFlow',
    inputSchema: ImpactStoryInputSchema,
    outputSchema: ImpactStoryOutputSchema,
  },
  async input => {
    const llmResponse = await prompt(input);
    const text = llmResponse.text;

    if (!text) {
      throw new Error('Could not generate story');
    }
    
    try {
        const jsonText = text.trim().replace(/^```json|```$/g, '').trim();
        const parsed = JSON.parse(jsonText);
        return ImpactStoryOutputSchema.parse(parsed);
    } catch(e) {
        console.error("Failed to parse AI response as JSON:", e);
        throw new Error('AI returned an invalid story format.');
    }
  }
);


export async function generateImpactStory(input: ImpactStoryInput): Promise<ImpactStoryOutput> {
  return impactStoryGeneratorFlow(input);
}
