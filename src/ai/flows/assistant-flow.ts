'use server';
/**
 * @fileOverview A simple AI assistant flow that streams responses.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AssistantInputSchema = z.object({
  history: z.array(
    z.object({
      role: z.enum(['user', 'model']),
      content: z.array(z.object({ text: z.string() })),
    })
  ),
  prompt: z.string(),
});

export type AssistantInput = z.infer<typeof AssistantInputSchema>;

export async function assistant(input: AssistantInput) {
  const { stream, response } = await ai.generateStream({
    prompt: input.prompt,
    history: input.history,
  });

  const outputStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        controller.enqueue(chunk.text);
      }
      controller.close();
    },
  });

  // Wait for the full response to be generated before completing the function.
  // This is important for ensuring the flow is tracked correctly.
  await response;

  return new Response(outputStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

export const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    // This is a bit of a workaround to fit the Response object into a flow.
    // In a real app, you might have the flow return the string and the API route handle the Response.
    return await assistant(input) as any;
  }
);
