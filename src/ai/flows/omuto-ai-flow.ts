'use server';

/**
 * @fileOverview The main conversational AI agent for Omuto Central.
 * This flow acts as an expert assistant, knowledgeable about all aspects
 * of the Omuto Foundation's operations.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { KNOWLEDGE_BASE } from '@/lib/data';
import { createCheckout } from '../tools/omuto-tools';

// Define the structure of a single message in the chat history
const HistoryMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.array(z.object({ text: z.string() })),
});

// Zod schema for the input to the flow
const OmutoAIInputSchema = z.object({
  question: z.string().describe("The user's current question or message."),
  history: z.array(HistoryMessageSchema).optional().describe('The chat history between the user and the AI.'),
  userId: z.string().describe("The user's unique ID."), // Added for context
});
export type OmutoAIInput = z.infer<typeof OmutoAIInputSchema>;

// Zod schema for the output from the AI
const OmutoAIOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer to the user\'s question.'),
});
export type OmutoAIOutput = z.infer<typeof OmutoAIOutputSchema>;

// The main flow function that orchestrates the AI's response
export async function omutoAIFlow(input: OmutoAIInput): Promise<OmutoAIOutput> {
    
    // Call the Gemini model with the prepared prompt and history
    const llmResponse = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        prompt: `UserId: ${input.userId}. User's message: "${input.question}"`,
        history: input.history,
        system: `${KNOWLEDGE_BASE}
        
## Tool Usage Instructions

- **createCheckout**: If the user asks to "check out", "submit my report", or a similar phrase, you MUST use this tool. Extract the 'task' (what they did today), 'learning' (what they learned), and 'tomorrowPlan' (what they will do tomorrow) from their message. The user ID is provided in the prompt. If any piece of information is missing, ask a clarifying question before using the tool. For example: "I can submit that for you. What was your key learning today?"`,
        tools: [createCheckout],
    });
    
    const choice = llmResponse.choices[0];
    
    // If the model used a tool, the answer is in the tool's response.
    // Otherwise, it's in the text part of the message.
    const toolResponse = choice.toolRequest?.responses[0];
    const answer = toolResponse
      ? String(toolResponse.response)
      : choice.message.content[0]?.text;

    if (!answer) {
      throw new Error('AI failed to generate a response.');
    }
    return { answer };
}
