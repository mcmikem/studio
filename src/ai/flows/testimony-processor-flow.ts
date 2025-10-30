
'use server';

/**
 * @fileOverview An AI flow to transcribe and analyze audio/video testimonies.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { media, Part } from 'genkit/content';

const TestimonyInputSchema = z.object({
  mediaUri: z.string().describe("A data URI of the audio or video file. Must be in a format supported by Gemini, like webm."),
});

const TestimonyOutputSchema = z.object({
  transcription: z.string().describe("The full transcription of the testimony."),
  summary: z.string().describe("A concise one-paragraph summary of the testimony."),
  quotes: z.array(z.string()).describe("A list of 2-3 powerful, impactful quotes from the testimony."),
  hashtags: z.array(z.string()).describe("A list of 3-5 relevant hashtags for social media (e.g., #Empowerment, #CommunityImpact)."),
});

export type TestimonyInput = z.infer<typeof TestimonyInputSchema>;
export type TestimonyOutput = z.infer<typeof TestimonyOutputSchema>;


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
        model: 'googleai/gemini-2.5-flash',
        prompt: [{
            media: {
                url: input.mediaUri,
            }
        }, {
            text: "Transcribe this audio. If there are multiple speakers, label them (e.g., Interviewer:, Speaker:).",
        }],
    });
    
    const transcription = llmResponse.text;

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
