
'use server';

/**
 * @fileOverview The main conversational AI agent for Omuto Central.
 * This flow acts as an expert assistant, knowledgeable about all aspects
 * of the Omuto Foundation's operations.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { KNOWLEDGE_BASE } from '@/lib/data';
import { createCheckout, getRecentCheckins, getRecentCheckouts, searchOmuto } from '../tools/omuto-tools';
import type { SearchResultItemSchema } from '@/lib/types';
import { format } from 'date-fns';

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
    try {
        // IMPORTANT: Ensure history is ordered from oldest to newest for the model.
        const history = input.history || [];

        // Call the Gemini model with the prepared prompt and history
        const llmResponse = await ai.generate({
            model: 'googleai/gemini-2.5-flash',
            prompt: `UserId: ${input.userId}. User's message: "${input.question}"`,
            history: history,
            system: `${KNOWLEDGE_BASE}
            
## Tool Usage Instructions & Dynamic Knowledge

Your knowledge is not just static; you can learn about the team's current activities and data by using the tools provided.

- **searchOmuto**: If the user asks a question about a person, program, project, or expense, use this tool to find the information from the database. This is your primary way of accessing organizational knowledge.
- **createCheckout**: If the user asks to "check out", "submit my report", or a similar phrase, you MUST use this tool. Extract the 'task' (what they did today), 'learning' (what they learned), and 'tomorrowPlan' (what they will do tomorrow) from their message. The user ID is provided in the prompt. If any piece of information is missing, ask a clarifying question before using the tool. For example: "I can submit that for you. What was your key learning today?"
- **getRecentCheckins / getRecentCheckouts**: You have the ability to get real-time updates from the team. If the user asks what the team is doing, what they did yesterday, who has checked in, or for a summary of recent activity, use these tools to get the latest data and then summarize it for the user. This is how you "learn" about the team's current state.`,
            tools: [searchOmuto, createCheckout, getRecentCheckins, getRecentCheckouts],
            config: {
                temperature: 0.2, // Be more factual
            }
        });
        
        let answer = llmResponse.text();

        // Handle tool requests if any
        if (llmResponse.hasToolRequest()) {
            const toolRequest = llmResponse.toolRequest();
            const toolOutput = await toolRequest.run();

            // A special handler to format search results nicely
            if (toolRequest.name === 'searchOmuto' && Array.isArray(toolOutput)) {
                const searchResults = toolOutput as z.infer<typeof SearchResultItemSchema>[];
                if (searchResults.length > 0) {
                    answer = "I found the following information:\n" + searchResults.map(r => `- **[${r.title}](${r.url})** - Type: ${r.type}`).join('\n');
                } else {
                    answer = "I couldn't find any information matching your query.";
                }
            } else if (toolRequest.name === 'getRecentCheckins' && Array.isArray(toolOutput)) {
                if (toolOutput.length > 0) {
                    answer = `Here are today's check-ins:\n` + toolOutput.map((c: any) => `- **${c.name}** is focusing on: *${c.primaryMission}*`).join('\n');
                } else {
                    answer = "No one has checked in yet today.";
                }
            } else if (toolRequest.name === 'getRecentCheckouts' && Array.isArray(toolOutput)) {
                 if (toolOutput.length > 0) {
                    answer = `Here are the latest check-outs from the team:\n` + toolOutput.map((c: any) => `- **${c.name}**: Completed *${c.tasks[0]?.description || 'their tasks'}*. Their key learning was "${c.learning || 'N/A'}".`).join('\n');
                } else {
                    answer = "There are no recent check-outs to display.";
                }
            } else {
                 if(toolOutput && typeof toolOutput === 'object' && 'message' in toolOutput) {
                   answer = String((toolOutput as any).message);
                 } else {
                   answer = String(toolOutput);
                 }
            }
        }

        if (!answer) {
          console.error("AI did not return a text or tool response.", llmResponse);
          answer = "I'm sorry, but I wasn't able to generate a response. Please try again.";
        }

        return { answer };
    } catch (error: any) {
        console.error("[omutoAIFlow] Critical error during AI generation:", error);
        // Provide a user-facing error message that doesn't expose internal details.
        return { answer: `I'm sorry, I encountered a server error and couldn't complete your request. The technical details are: ${error.message}` };
    }
}
