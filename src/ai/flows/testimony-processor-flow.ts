
'use server';

/**
 * @fileOverview An AI flow to transcribe and analyze audio/video testimonies.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { TestimonyInput, TestimonyOutput } from '@/lib/types';
import { TestimonyInputSchema, TestimonyOutputSchema } from '@/lib/types';

const analysisPrompt = ai.definePrompt(
  {
    name: 'analyzeTestimonyPrompt',
    input: { schema: z.object({ transcription: z.string() }) },
    prompt: `You are an expert communications assistant for a youth-led NGO in Uganda. You are brilliant at finding the core message in a story.
    Analyze the following transcription of a beneficiary's testimony.
    
    Your entire output MUST be a single, valid JSON object that conforms to the following Zod schema:
    \`\`\`
    z.object({
        summary: z.string().describe("A concise one-paragraph summary of the testimony."),
        quotes: z.array(z.string()).describe("A list of 2-3 powerful, impactful quotes from the testimony."),
        hashtags: z.array(z.string()).describe("A list of 3-5 relevant social media hashtags for social media (e.g., #Empowerment, #CommunityImpact)."),
    })
    \`\`\`
    
    Transcription:
    ---
    {{{transcription}}}
    ---

    Now, generate the JSON object.
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
        model: 'googleai/gemini-pro',
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
    const text = analysisResult.text;
    if (!text) {
      throw new Error('AI failed to analyze the transcription.');
    }

    try {
        const jsonText = text.trim().replace(/^```json|```$/g, '').trim();
        const parsed = JSON.parse(jsonText);
        const validated = TestimonyOutputSchema.pick({ summary: true, quotes: true, hashtags: true }).parse(parsed);
        
        return {
          transcription,
          summary: validated.summary,
          quotes: validated.quotes,
          hashtags: validated.hashtags,
        };
    } catch (e) {
        console.error("Failed to parse analysis from AI response as JSON:", e);
        throw new Error('AI returned an invalid analysis format.');
    }
  }
);


export async function processTestimony(input: TestimonyInput): Promise<TestimonyOutput> {
    return processTestimonyFlow(input);
}
