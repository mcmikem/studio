
'use server';

/**
 * @fileOverview The main conversational AI agent for Omuto Central.
 * This flow acts as an expert assistant, knowledgeable about all aspects
 * of the Omuto Foundation's operations.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { KNOWLEDGE_BASE } from '@/lib/data';
import { createCheckout, getRecentCheckins, getRecentCheckouts } from '../tools/omuto-tools';

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

- **createCheckout**: If the user asks to "check out", "submit my report", or a similar phrase, you MUST use this tool. Extract the 'task' (what they did today), 'learning' (what they learned), and 'tomorrowPlan' (what they will do tomorrow) from their message. The user ID is provided in the prompt. If any piece of information is missing, ask a clarifying question before using the tool. For example: "I can submit that for you. What was your key learning today?"
- **getRecentCheckins / getRecentCheckouts**: If the user asks what the team is doing, what they did yesterday, who has checked in, or for a summary of recent activity, use these tools to get the latest data and then summarize it for the user.`,
        tools: [createCheckout, getRecentCheckins, getRecentCheckouts],
    });
    
    const toolResponse = llmResponse.toolRequest?.responses[0];
    let answer = toolResponse
      ? String(toolResponse.response)
      : llmResponse.text;

    if (!answer) {
      console.error("AI did not return a text or tool response.", llmResponse);
      answer = "I'm sorry, but I wasn't able to generate a response. Please try again.";
    }

    return { answer };
}
