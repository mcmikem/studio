
'use server';

/**
 * @fileOverview The main conversational AI agent for Omuto Central.
 * This flow acts as an expert assistant, knowledgeable about all aspects
 * of the Omuto Foundation's operations.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { KNOWLEDGE_BASE } from '@/lib/data';
import { createCheckoutTool, getRecentCheckinsTool, getRecentCheckoutsTool, searchOmutoTool } from '../tools/omuto-tools';
import { format } from 'date-fns';
import type { OmutoAIInput, OmutoAIOutput } from '@/lib/types';

// The main flow function that orchestrates the AI's response
export async function omutoAIFlow(input: OmutoAIInput): Promise<OmutoAIOutput> {
    try {
        // IMPORTANT: Ensure history is ordered from oldest to newest for the model.
        const history = input.history || [];

        // Call the Gemini model with the prepared prompt and history
        // The Genkit framework will automatically handle tool execution.
        const llmResponse = await ai.generate({
            model: 'googleai/gemini-pro',
            prompt: `
            You are Omuto AI, an expert assistant for the Omuto Foundation, a youth-led NGO in Uganda.
            Your knowledge is not just static; you can learn about the team's current activities and data by using the tools provided.

            ## Knowledge Base
            ${KNOWLEDGE_BASE}
            
            ## Tool Usage Instructions & Dynamic Knowledge

            - **searchOmuto**: If the user asks a question about a person, program, project, or expense, use this tool to find the information from the database. This is your primary way of accessing organizational knowledge.
            - **createCheckout**: If the user asks to "check out", "submit my report", or a similar phrase, you MUST use this tool. Extract the 'task' (what they did today), 'learning' (what they learned), and 'tomorrowPlan' (what they will do tomorrow) from their message. The user ID is provided in the prompt. If any piece of information is missing, ask a clarifying question before using the tool. For example: "I can submit that for you. What was your key learning today?"
            - **getRecentCheckins / getRecentCheckouts**: You have the ability to get real-time updates from the team. If the user asks what the team is doing, what they did yesterday, who has checked in, or for a summary of recent activity, use these tools to get the latest data and then summarize it for the user. This is how you "learn" about the team's current state.

            ---
            UserId: ${input.userId}. User's message: "${input.question}"`,
            history: history,
            tools: [searchOmutoTool, createCheckoutTool, getRecentCheckinsTool, getRecentCheckoutsTool],
            config: {
                temperature: 0.2, // Be more factual
            }
        });
        
        const answer = llmResponse.text();
        
        if (!answer) {
            console.error("AI did not return a text response, even after potential tool use.", llmResponse);
            // This condition is now more of a fallback, as Genkit's `generate` with tools should still result in a text response.
            if (llmResponse.toolRequest()) {
              return { answer: "I've processed your request using my tools, but I don't have a final text summary to provide." };
            }
            return { answer: "I'm sorry, but I wasn't able to generate a response. Please try again." };
        }
        
        return { answer };

    } catch (error: any) {
        console.error("[omutoAIFlow] Critical error during AI generation:", error);
        // Provide a user-facing error message that doesn't expose internal details.
        return { answer: `I'm sorry, I encountered a server error and couldn't complete your request.` };
    }
}
