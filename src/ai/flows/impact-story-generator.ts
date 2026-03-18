
/**
 * @fileOverview A GenAI-powered tool to automatically generate compelling narratives from activity data.
 * Uses OpenRouter for AI generation
 */

import { callOpenRouter, DEFAULT_MODEL } from '@/lib/openrouter';
import { aiConfig } from '@/lib/ai';
import { ImpactStoryInputSchema, ImpactStoryOutputSchema, type ImpactStoryInput, type ImpactStoryOutput } from '@/lib/types';
import { z } from 'zod';

const systemPrompt = `You are a skilled storyteller for Omuto Foundation, crafting engaging narratives that highlight the impact of our activities. Your output must be a JSON object with a single key "impactStory".
Focus on the human impact and the positive change created. Be compelling and inspiring.`;

import { ai } from '@/ai/genkit';

const storyPrompt = ai.definePrompt({
  name: 'storyPrompt',
  model: 'googleai/gemini-2.0-flash',
  system: `You are a skilled storyteller for Omuto Foundation, crafting engaging narratives that highlight the impact of our activities.
Focus on the human impact and the positive change created. Be compelling and inspiring.`,
  output: {
    schema: ImpactStoryOutputSchema
  }
});

export async function generateImpactStory(input: ImpactStoryInput): Promise<ImpactStoryOutput> {
  const prompt = `
Based on the following activity data, generate a compelling story suitable for social media and Omuto Pulse.

Activity Name: ${input.activityName}
Activity Description: ${input.activityDescription}
Measurable Impact: ${input.activityImpact}
Team Member: ${input.userName}

${input.memorableMoment ? `Memorable Moment: "${input.memorableMoment}"`: ''}
${input.challengesLearned ? `Key Learning: "${input.challengesLearned}"` : ''}
${input.userQuote ? `Quote from a Beneficiary: "${input.userQuote}"`: ''}

Return a compelling narrative in the "impactStory" field.
`;

  // 1. Try OpenRouter if configured
  if (aiConfig.provider === 'openrouter' && aiConfig.openRouterApiKey) {
    try {
      const systemPrompt = `You are a skilled storyteller for Omuto Foundation. Return valid JSON only.`;
      const text = await callOpenRouter(prompt, systemPrompt, DEFAULT_MODEL, 0.8);
      
      const jsonMatch = text.match(/\{"impactStory"[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { impactStory: text };
    } catch (error) {
      console.error('Impact Story OpenRouter failed:', error);
    }
  }

  // 2. Try Gemini (Genkit) if configured
  if (aiConfig.isConfigured) {
    try {
      console.log('[ImpactStory] Attempting Gemini generation');
      const response = await storyPrompt({ input: prompt });
      if (response.output) {
        return response.output as ImpactStoryOutput;
      }
    } catch (error) {
      console.error('Impact Story Gemini failed:', error);
    }
  }

  return { impactStory: "AI generation unavailable. Please check your configuration." };
}
