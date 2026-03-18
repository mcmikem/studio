
/**
 * @fileOverview The main conversational AI agent for Omuto Central.
 * Simplified to use ai.generate() directly instead of definePrompt with tools/history,
 * which caused internal Genkit crashes ("Cannot read properties of undefined (reading 'content')").
 */

import { ai } from '@/ai/genkit';
import {
  OmutoAIInputSchema,
  OmutoAIOutputSchema,
  type OmutoAIInput,
  type OmutoAIOutput,
} from '@/lib/types';

const SYSTEM_PROMPT = `You are an expert assistant for the Omuto Foundation, a youth-led NGO in Uganda. Your name is Omuto AI.
Be helpful, knowledgeable, and friendly. Be concise and actionable.
You help with planning, reporting, team coordination, and general questions about the foundation's work.`;

// --- FLOW DEFINITION ---

export const omutoAIFlow = ai.defineFlow(
  {
    name: 'omutoAIFlow',
    inputSchema: OmutoAIInputSchema,
    outputSchema: OmutoAIOutputSchema,
  },
  async (input: OmutoAIInput): Promise<OmutoAIOutput> => {
    try {
        const { question } = input;

        if (!question) {
          return { answer: "Please ask me a question!" };
        }

        console.log(`[OmutoAI-Gemini] Question: "${question.substring(0, 50)}..."`);

        // Use ai.generate() directly — much simpler and more reliable than definePrompt
        const llmResponse = await ai.generate({
          model: 'googleai/gemini-2.0-flash',
          system: SYSTEM_PROMPT,
          prompt: question,
        });
        
        // .text is a getter on Genkit GenerateResponse
        const answer = llmResponse.text;
        
        if (!answer || answer.trim() === '') {
            console.error("[OmutoAI-Gemini] Empty response from AI");
            return { answer: "I didn't get a response. Please try again." };
        }
        
        console.log('[OmutoAI-Gemini] Response received, length:', answer.length);
        return { answer };

    } catch (error: any) {
        console.error('[OmutoAI-Gemini] Error:', error);
        
        const errorMessage = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
        console.error('[OmutoAI-Gemini] Detailed Error:', errorMessage);
        
        return { answer: `I couldn't process that with Gemini: ${errorMessage.substring(0, 150)}` };
    }
  }
);
