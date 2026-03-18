
/**
 * @fileOverview An AI flow to transcribe and analyze audio/video testimonies.
 * Uses OpenRouter for AI generation
 */

import { callOpenRouter, DEFAULT_MODEL } from '@/lib/openrouter';
import { aiConfig } from '@/lib/ai';
import { z } from 'zod';
import type { TestimonyInput, TestimonyOutput } from '@/lib/types';
import { TestimonyInputSchema, TestimonyOutputSchema } from '@/lib/types';

import { ai } from '@/ai/genkit';

const TestimonyPrompt = ai.definePrompt({
  name: 'testimonyPrompt',
  model: 'googleai/gemini-2.0-flash',
  system: `You are an expert communications assistant for a youth-led NGO in Uganda. You are brilliant at finding the core message in a story.`,
  output: {
    schema: TestimonyOutputSchema
  }
});

export async function processTestimony(input: TestimonyInput): Promise<TestimonyOutput> {
  const transcriptionText = input.transcription || '';
  const prompt = `Analyze the following transcription of a beneficiary's testimony:\n\n${transcriptionText}\n\nReturn a summary, key quotes, and relevant hashtags.`;

  // 1. Try OpenRouter if configured
  if (aiConfig.provider === 'openrouter' && aiConfig.openRouterApiKey) {
    try {
      const systemPrompt = `You are an expert communications assistant for a youth-led NGO in Uganda. Return valid JSON only.`;
      const text = await callOpenRouter(prompt, systemPrompt, DEFAULT_MODEL, 0.7);
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          transcription: transcriptionText,
          summary: parsed.summary || 'Summary not available',
          quotes: parsed.quotes || [],
          hashtags: parsed.hashtags || ['#OmutoFoundation']
        };
      }
    } catch (error) {
      console.error('Testimony OpenRouter failed:', error);
    }
  }

  // 2. Try Gemini (Genkit) if configured
  if (aiConfig.isConfigured) {
    try {
      console.log('[TestimonyProcessor] Attempting Gemini generation');
      const response = await TestimonyPrompt({ input: prompt });
      if (response.output) {
        return {
           ...response.output,
           transcription: transcriptionText
        };
      }
    } catch (error) {
      console.error('Testimony Gemini failed:', error);
    }
  }

  // 3. Fallback
  return {
    transcription: transcriptionText,
    summary: 'AI analysis unavailable. Please check your configuration.',
    quotes: [],
    hashtags: ['#OmutoFoundation']
  };
}
