
/**
 * @fileOverview A GenAI-powered tool to automatically generate compelling narratives from activity data.
 */

import { ai } from '@/ai/genkit';
import { ImpactStoryInputSchema, ImpactStoryOutputSchema, type ImpactStoryInput, type ImpactStoryOutput } from '@/lib/types';

export const impactStoryFlow = ai.defineFlow({
    name: 'impactStoryFlow',
    inputSchema: ImpactStoryInputSchema,
    outputSchema: ImpactStoryOutputSchema
}, async (input) => {
    const prompt = `You are a skilled storyteller for Omuto Foundation, crafting engaging narratives that highlight the impact of our activities. Your output must be a JSON object with a single key "impactStory".
  
  Based on the following activity data, generate a compelling story suitable for social media and Omuto Pulse. Weave in the narrative details provided to make the story authentic and inspiring. Focus on the human impact and the positive change created.

  Activity Name: ${input.activityName}
  Activity Description: ${input.activityDescription}
  Measurable Impact: ${input.activityImpact}
  Team Member: ${input.userName}
  
  ${input.memorableMoment ? `Memorable Moment: "${input.memorableMoment}"`: ''}

  ${input.challengesLearned ? `Key Learning: "${input.challengesLearned}"` : ''}

  ${input.userQuote ? `Quote from a Beneficiary: "${input.userQuote}"`: ''}`;

    const result = await ai.generate({
        prompt: prompt,
        output: { schema: ImpactStoryOutputSchema },
      });
  
      if (!result.output) {
          throw new Error('Could not generate story');
      }
      
      return result.output;
});
