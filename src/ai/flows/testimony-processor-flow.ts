
'use server';

/**
 * @fileOverview An AI flow to transcribe and analyze audio/video testimonies.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { TestimonyInput, TestimonyOutput } from '@/lib/types';
import { TestimonyInputSchema, TestimonyOutputSchema } from '@/lib/types';


const analysisPrompt = `You are an expert communications assistant for a youth-led NGO in Uganda. You are brilliant at finding the core message in a story.
    Analyze the following transcription of a beneficiary's testimony and return a JSON object with a summary, key quotes, and relevant hashtags.
    
    Transcription:
    ---
    {{{transcription}}}
    ---
    `;


export const processTestimony = ai.defineFlow(
  {
    name: 'processTestimonyFlow',
    inputSchema: TestimonyInputSchema,
    outputSchema: TestimonyOutputSchema,
  },
  async (input) => {
    
    // 1. Transcribe the audio/video
    const { text: transcription } = await ai.generate({
        model: 'googleai/gemini-1.5-flash-latest',
        prompt: [
          { text: "Please transcribe the following audio. The audio is a testimony from a beneficiary of an NGO in Uganda. Capture the speech as accurately as possible. If there is more than one speaker, try to differentiate them." },
          { media: { url: input.mediaUri } }
        ],
    });
    
    if (!transcription) {
      throw new Error('AI failed to transcribe the audio.');
    }

    // 2. Analyze the transcription
    const { output: analysisOutput } = await ai.generate({
      model: 'googleai/gemini-1.5-flash-latest',
      prompt: analysisPrompt,
      input: { transcription },
      output: { schema: TestimonyOutputSchema.pick({ summary: true, quotes: true, hashtags: true }) }
    });

    if (!analysisOutput) {
      throw new Error('AI failed to analyze the transcription.');
    }
        
    return {
      transcription,
      summary: analysisOutput.summary,
      quotes: analysisOutput.quotes,
      hashtags: analysisOutput.hashtags,
    };
  }
);
