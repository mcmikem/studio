
/**
 * @fileOverview An AI flow to transcribe and analyze audio/video testimonies.
 * Uses OpenRouter for AI generation
 */

import { callOpenRouter, DEFAULT_MODEL } from '@/lib/openrouter';
import { aiConfig } from '@/lib/ai';
import { z } from 'zod';
import type { TestimonyInput, TestimonyOutput } from '@/lib/types';
import { TestimonyInputSchema, TestimonyOutputSchema } from '@/lib/types';

export async function processTestimony(input: TestimonyInput): Promise<TestimonyOutput> {
  const systemPrompt = `You are an expert communications assistant for a youth-led NGO in Uganda. You are brilliant at finding the core message in a story.`;

  if (aiConfig.provider === 'openrouter') {
    try {
      const prompt = `Analyze the following transcription of a beneficiary's testimony and return a JSON object with a summary, key quotes, and relevant hashtags.
      
Return JSON with: summary, quotes (array), hashtags (array).

If you have the transcription text, include it.`;

      const text = await callOpenRouter(prompt, systemPrompt, DEFAULT_MODEL, 0.7);
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          transcription: '',
          summary: parsed.summary || 'Summary not available',
          quotes: parsed.quotes || [],
          hashtags: parsed.hashtags || ['#OmutoFoundation']
        };
      }
      
      return {
        transcription: '',
        summary: 'Could not analyze testimony at this time',
        quotes: [],
        hashtags: ['#OmutoFoundation']
      };
    } catch (error) {
      console.error('Testimony processing failed:', error);
      return {
        transcription: '',
        summary: 'Error processing testimony',
        quotes: [],
        hashtags: ['#OmutoFoundation']
      };
    }
  }

  // Fallback
  return {
    transcription: '',
    summary: 'AI service not configured. Set up OpenRouter for AI-powered analysis.',
    quotes: [],
    hashtags: ['#OmutoFoundation']
  };
}
