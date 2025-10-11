
'use server';

/**
 * @fileOverview The main conversational AI agent for Omuto Central.
 * This flow acts as an expert assistant, knowledgeable about all aspects
 * of the Omuto Foundation's operations.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { KNOWLEDGE_BASE } from '@/lib/data';

// Define the structure of a single message in the chat history
const HistoryMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.array(z.object({ text: z.string() })),
});

// Zod schema for the input to the flow
const OmutoAIInputSchema = z.object({
  question: z.string().describe("The user's current question or message."),
  history: z.array(HistoryMessageSchema).optional().describe('The chat history between the user and the AI.'),
});
export type OmutoAIInput = z.infer<typeof OmutoAIInputSchema>;

// Zod schema for the output from the AI
const OmutoAIOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer to the user\'s question.'),
});
export type OmutoAIOutput = z.infer<typeof OmutoAIOutputSchema>;

// Define the main prompt for the Omuto AI
const omutoAIPrompt = ai.definePrompt(
  {
    name: 'omutoAIPrompt',
    input: { schema: OmutoAIInputSchema },
    output: { schema: OmutoAIOutputSchema },
    system: KNOWLEDGE_BASE, // Embed the entire organizational knowledge base
    prompt: `You are Omuto AI, an expert assistant for the Omuto Foundation. Your purpose is to provide accurate, helpful, and concise information to team members. Use the provided knowledge base and your internal reasoning to answer questions about planning, reporting, data analysis, M&E, and team operations. Be professional, encouraging, and align all guidance with Omuto's operational standards.

    You can format your answers using markdown (e.g., for lists, bolding).

    Start responding to the user's question now.

    User's Question:
    {{question}}`,
  }
);


// The main flow function that orchestrates the AI's response
export async function omutoAIFlow(input: OmutoAIInput): Promise<OmutoAIOutput> {
    
    // Call the Gemini model with the prepared prompt and history
    const llmResponse = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        prompt: input.question,
        history: input.history,
        system: KNOWLEDGE_BASE,
        output: {
            schema: OmutoAIOutputSchema,
        }
    });
    
    const output = llmResponse.output();

    if (!output) {
      throw new Error('AI failed to generate a response.');
    }
    return { answer: output.answer };
}
