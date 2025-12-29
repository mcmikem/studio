
'use server';

/**
 * @fileOverview An AI flow to transcribe and analyze audio/video testimonies.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { TestimonyInput, TestimonyOutput } from '@/lib/types';
import { TestimonyInputSchema, TestimonyOutputSchema } from '@/lib/types';

// Export type for external use
export type { TestimonyOutput };

const testimonyAnalysisPrompt = ai.definePrompt({
    name: 'testimonyAnalysisPrompt',
    input: { schema: z.object({ transcription: z.string() }) },
    output: { schema: TestimonyOutputSchema.pick({ summary: true, quotes: true, hashtags: true }) },
    model: 'googleai/gemini-1.5-flash',
    prompt: `You are an expert communications assistant for a youth-led NGO in Uganda. You are brilliant at finding the core message in a story.
    Analyze the following transcription of a beneficiary's testimony and return a JSON object with a summary, key quotes, and relevant hashtags.
    
    Transcription:
    ---
    {{{transcription}}}
    ---
    `,
});


export const processTestimony = ai.defineFlow(
  {
    name: 'processTestimonyFlow',
    inputSchema: TestimonyInputSchema,
    outputSchema: TestimonyOutputSchema,
  },
  async (input) => {
    
    // 1. Transcribe the audio/video
    const transcriptionResponse = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        prompt: [
          { text: "Please transcribe the following audio. The audio is a testimony from a beneficiary of an NGO in Uganda. Capture the speech as accurately as possible. If there is more than one speaker, try to differentiate them." },
          { media: { url: input.mediaUri } }
        ],
    });
    
    const transcription = transcriptionResponse.text;

    if (!transcription) {
      throw new Error('AI failed to transcribe the audio.');
    }

    // 2. Analyze the transcription
    const { output: analysisOutput } = await testimonyAnalysisPrompt({ transcription });

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
