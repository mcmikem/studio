'use server';

/**
 * @fileOverview An AI flow to transcribe and analyze audio/video testimonies.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { TestimonyInput, TestimonyOutput } from '@/lib/types';
import { TestimonyInputSchema, TestimonyOutputSchema } from '@/lib/types';

const analysisPrompt = ai.definePrompt(
  {
    name: 'analyzeTestimonyPrompt',
    input: { schema: z.object({ transcription: z.string() }) },
    output: { schema: TestimonyOutputSchema.pick({ summary: true, quotes: true, hashtags: true }) },
    system: `You are an expert communications assistant for a youth-led NGO in Uganda. You are brilliant at finding the core message in a story.
    Analyze the following transcription of a beneficiary's testimony.
    - Summarize the key points into one compelling paragraph.
    - Extract 2-3 of the most powerful and emotional quotes.
    - Suggest 3-5 relevant social media hashtags starting with '#'.`,
    prompt: `Transcription:
    ---
    {{{transcription}}}
    ---
    `,
  }
);


const processTestimonyFlow = ai.defineFlow(
  {
    name: 'processTestimonyFlow',
    inputSchema: TestimonyInputSchema,
    outputSchema: TestimonyOutputSchema,
  },
  async (input) => {
    
    // 1. Transcribe the audio/video
    const llmResponse = await ai.generate({
        prompt: [
          { text: "Please transcribe the following audio. The audio is a testimony from a beneficiary of an NGO in Uganda. Capture the speech as accurately as possible. If there is more than one speaker, try to differentiate them." },
          { media: { url: input.mediaUri } }
        ],
    });
    
    const transcription = llmResponse.output?.message.content.find(part => part.text)?.text;

    if (!transcription) {
      throw new Error('AI failed to transcribe the audio.');
    }

    // 2. Analyze the transcription
    const analysisResult = await analysisPrompt({ transcription });
    if (!analysisResult.output) {
      throw new Error('AI failed to analyze the transcription.');
    }
    
    return {
      transcription,
      summary: analysisResult.output.summary,
      quotes: analysisResult.output.quotes,
      hashtags: analysisResult.output.hashtags,
    };
  }
);


export async function processTestimony(input: TestimonyInput): Promise<TestimonyOutput> {
    return processTestimonyFlow(input);
}
