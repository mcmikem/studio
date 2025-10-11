
'use server';

/**
 * @fileOverview The main AI assistant flow for Omuto Central.
 * This assistant now receives context from the client and uses tools for specific actions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { KNOWLEDGE_BASE } from '@/lib/data';

// Note: The data-fetching tools have been removed from this file.
// The client is now responsible for fetching data and passing it into the prompt.
// This is more performant and secure as it uses the user's authenticated session.

// Example of a tool that performs an *action* rather than just fetching data.
// We are keeping this structure for potential future use cases like creating a calendar event, etc.
const exampleActionTool = ai.defineTool(
  {
    name: 'exampleAction',
    description: 'An example tool that performs a specific server-side action.',
    inputSchema: z.object({
        actionDetail: z.string(),
    }),
    outputSchema: z.object({
        success: z.boolean(),
        message: z.string(),
    }),
  },
  async (input) => {
    // In a real scenario, you could perform a secured action here.
    console.log("Performing action with detail:", input.actionDetail);
    return { success: true, message: `Action '${input.actionDetail}' completed.` };
  }
);


export const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (prompt) => {
    
    // The system prompt now expects context (like program lists, tasks, etc.) to be included directly in the user's prompt.
    const llmResponse = await ai.generate({
      prompt: prompt,
      system: KNOWLEDGE_BASE + "\n\nThe user has provided the following context from the application. Use this live data to answer their question.",
      tools: [exampleActionTool], // Keeping tool structure for future action-based tools
    });
    
    return llmResponse.text;
  }
);


export async function streamAssistant(prompt: string) {
    const stream = ai.generateStream({
        prompt: prompt,
        system: KNOWLEDGE_BASE + "\n\nThe user has provided the following context from the application. Use this live data to answer their question.",
        tools: [exampleActionTool], // Keeping tool structure for future action-based tools
    });
    return {stream, response: stream.response};
}

    