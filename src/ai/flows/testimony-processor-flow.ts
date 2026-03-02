
/**
 * @fileOverview An AI flow to transcribe and analyze audio/video testimonies.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { TestimonyInput } from '@/lib/types';
import { TestimonyInputSchema, TestimonyOutputSchema } from '@/lib/types';


const TestimonyAnalysisSchema = z.object({
    summary: z.string().describe("A concise summary of the testimony."),
    quotes: z.array(z.string()).describe("A list of 1-3 impactful quotes from the transcription."),
    hashtags: z.array(z.string()).describe("A list of 3-5 relevant social media hashtags (e.g., #YouthEmpowerment)."),
});


export const testimonyProcessorFlow = ai.defineFlow(
  {
    name: 'testimonyProcessorFlow',
    inputSchema: TestimonyInputSchema,
    outputSchema: TestimonyOutputSchema,
  },
  async (input) => {
    
    // 1. Transcribe the audio/video
    const transcriptionResponse = await ai.generate({
        model: 'googleai/gemini-flash-latest',
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
    const analysisPrompt = `You are an expert communications assistant for a youth-led NGO in Uganda. You are brilliant at finding the core message in a story.
    Analyze the following transcription of a beneficiary's testimony and return a JSON object with a summary, key quotes, and relevant hashtags.
    
    Transcription:
    ---
    ${transcription}
    ---
    `;

    const analysisResult = await ai.generate({
        model: 'googleai/gemini-flash-latest',
        prompt: analysisPrompt,
        output: { schema: TestimonyAnalysisSchema },
    });

    const analysisOutput = analysisResult.output;

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
